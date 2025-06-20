// Emergency alerting service
import { io } from "../index"
import { supabase } from "./supabase"

export interface Alert {
  id: string
  type: "disaster" | "resource" | "system" | "weather"
  severity: "info" | "warning" | "critical" | "emergency"
  title: string
  message: string
  location?: {
    lat: number
    lng: number
    radius: number
    name: string
  }
  expires_at?: string
  created_at: string
}

class AlertingService {
  private activeAlerts: Map<string, Alert> = new Map()

  async createAlert(alertData: Omit<Alert, "id" | "created_at">): Promise<Alert> {
    const alert: Alert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
    }

    this.activeAlerts.set(alert.id, alert)

    // Store in database
    await supabase.from("alerts").insert({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      location: alert.location ? `POINT(${alert.location.lng} ${alert.location.lat})` : null,
      location_name: alert.location?.name,
      radius: alert.location?.radius,
      expires_at: alert.expires_at,
      created_at: alert.created_at,
    })

    // Broadcast alert
    this.broadcastAlert(alert)

    return alert
  }

  private broadcastAlert(alert: Alert) {
    // Global broadcast for critical/emergency alerts
    if (["critical", "emergency"].includes(alert.severity)) {
      io.emit("emergency_alert", alert)
    }

    // Location-based broadcast
    if (alert.location) {
      this.broadcastToLocation(alert, alert.location)
    }

    // Type-based broadcast
    io.emit(`${alert.type}_alert`, alert)

    console.log(`🚨 Alert broadcasted: ${alert.severity.toUpperCase()} - ${alert.title}`)
  }

  private broadcastToLocation(alert: Alert, location: { lat: number; lng: number; radius: number }) {
    // This would integrate with the socket connection manager
    // to send alerts to clients within the specified radius
    io.emit("location_alert", {
      alert,
      location,
    })
  }

  async dismissAlert(alertId: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId)
    if (!alert) return false

    this.activeAlerts.delete(alertId)

    // Update database
    await supabase.from("alerts").update({ dismissed_at: new Date().toISOString() }).eq("id", alertId)

    // Broadcast dismissal
    io.emit("alert_dismissed", { alertId })

    return true
  }

  async getActiveAlerts(location?: { lat: number; lng: number; radius: number }): Promise<Alert[]> {
    let query = supabase
      .from("alerts")
      .select("*")
      .is("dismissed_at", null)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("created_at", { ascending: false })

    if (location) {
      // Add spatial query for location-based alerts
      query = query.or(
        `location.is.null,location.st_dwithin(st_geogfromtext('POINT(${location.lng} ${location.lat})'),${location.radius})`,
      )
    }

    const { data, error } = await query

    if (error) {
      console.error("Failed to fetch alerts:", error)
      return []
    }

    return (data || []).map((row) => ({
      id: row.id,
      type: row.type,
      severity: row.severity,
      title: row.title,
      message: row.message,
      location: row.location
        ? {
            lat: row.location.coordinates[1],
            lng: row.location.coordinates[0],
            radius: row.radius || 10000,
            name: row.location_name || "Unknown",
          }
        : undefined,
      expires_at: row.expires_at,
      created_at: row.created_at,
    }))
  }

  // Automated alert triggers
  async checkDisasterAlerts() {
    try {
      // Check for new critical disasters
      const { data: criticalDisasters } = await supabase
        .from("disasters")
        .select("*")
        .eq("priority", "critical")
        .eq("status", "active")
        .gte("created_at", new Date(Date.now() - 300000).toISOString()) // Last 5 minutes

      for (const disaster of criticalDisasters || []) {
        await this.createAlert({
          type: "disaster",
          severity: "emergency",
          title: `Critical Disaster: ${disaster.title}`,
          message: `Emergency response required for ${disaster.title} in ${disaster.location_name}`,
          location: disaster.location
            ? {
                lat: disaster.location.coordinates[1],
                lng: disaster.location.coordinates[0],
                radius: 50000, // 50km radius
                name: disaster.location_name,
              }
            : undefined,
        })
      }
    } catch (error) {
      console.error("Disaster alert check failed:", error)
    }
  }

  async checkResourceAlerts() {
    try {
      // Check for resources at capacity
      const { data: fullResources } = await supabase
        .from("resources")
        .select("*")
        .eq("status", "full")
        .not("capacity", "is", null)
        .gte("updated_at", new Date(Date.now() - 300000).toISOString()) // Last 5 minutes

      for (const resource of fullResources || []) {
        await this.createAlert({
          type: "resource",
          severity: "warning",
          title: `Resource at Capacity: ${resource.name}`,
          message: `${resource.name} (${resource.type}) is now at full capacity (${resource.current_occupancy}/${resource.capacity})`,
          location: resource.location
            ? {
                lat: resource.location.coordinates[1],
                lng: resource.location.coordinates[0],
                radius: 10000, // 10km radius
                name: resource.location_name,
              }
            : undefined,
        })
      }
    } catch (error) {
      console.error("Resource alert check failed:", error)
    }
  }
}

export const alertingService = new AlertingService()

// Run automated checks every 5 minutes
setInterval(() => {
  alertingService.checkDisasterAlerts()
  alertingService.checkResourceAlerts()
}, 300000)
