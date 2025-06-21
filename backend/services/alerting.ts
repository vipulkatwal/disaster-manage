// Priority Alert System for Disaster Response
import { supabase } from "./supabase"
import { serverSocketManager } from "./socket"
import { classifyUrgency } from "./gemini"

export interface Alert {
  id: string
  type: "social_media" | "disaster" | "resource" | "system"
  priority: "low" | "medium" | "high" | "critical"
  title: string
  message: string
  source: string
  location?: {
    lat: number
    lng: number
    name: string
  }
  metadata?: any
  created_at: string
  acknowledged_by?: string[]
  resolved: boolean
}

export interface AlertRule {
  id: string
  name: string
  conditions: {
    keywords: string[]
    urgency_threshold: "low" | "medium" | "high" | "critical"
    platforms?: string[]
    location_radius?: number
  }
  actions: {
    notify_users: string[]
    create_alert: boolean
    auto_escalate: boolean
  }
  enabled: boolean
}

class AlertingService {
  private alertRules: AlertRule[] = [
    {
      id: "urgent_sos",
      name: "SOS/Urgent Help Detection",
      conditions: {
        keywords: ["SOS", "urgent", "help", "emergency", "critical", "immediate", "trapped", "injured"],
        urgency_threshold: "high",
        platforms: ["twitter", "bluesky", "facebook"],
      },
      actions: {
        notify_users: ["reliefAdmin", "netrunnerX"],
        create_alert: true,
        auto_escalate: true,
      },
      enabled: true,
    },
    {
      id: "medical_emergency",
      name: "Medical Emergency Detection",
      conditions: {
        keywords: ["medical", "hospital", "ambulance", "doctor", "injury", "bleeding", "unconscious"],
        urgency_threshold: "high",
      },
      actions: {
        notify_users: ["reliefAdmin"],
        create_alert: true,
        auto_escalate: true,
      },
      enabled: true,
    },
    {
      id: "evacuation_alert",
      name: "Evacuation Alert Detection",
      conditions: {
        keywords: ["evacuate", "evacuation", "leave", "danger", "unsafe", "collapse"],
        urgency_threshold: "medium",
      },
      actions: {
        notify_users: ["reliefAdmin", "netrunnerX"],
        create_alert: true,
        auto_escalate: false,
      },
      enabled: true,
    },
  ]

  async processSocialMediaPost(post: any): Promise<Alert | null> {
    // Check if post matches any alert rules
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue

      const matches = this.checkRuleConditions(post, rule.conditions)
      if (matches) {
        const alert = await this.createAlert({
          type: "social_media",
          priority: rule.conditions.urgency_threshold,
          title: `Priority Alert: ${rule.name}`,
          message: `Urgent social media post detected: "${post.content.substring(0, 100)}..."`,
          source: post.platform,
          location: post.location,
          metadata: {
            post_id: post.id,
            author: post.author,
            engagement: post.engagement,
            rule_id: rule.id,
          },
        })

        // Execute rule actions
        await this.executeRuleActions(alert, rule.actions)
        return alert
      }
    }

    return null
  }

  private checkRuleConditions(post: any, conditions: AlertRule["conditions"]): boolean {
    // Check keywords
    const postText = post.content.toLowerCase()
    const hasKeywords = conditions.keywords.some(keyword =>
      postText.includes(keyword.toLowerCase())
    )
    if (!hasKeywords) return false

    // Check urgency threshold
    const urgencyLevels = { low: 1, medium: 2, high: 3, critical: 4 }
    const postUrgency = urgencyLevels[post.urgency] || 1
    const threshold = urgencyLevels[conditions.urgency_threshold]
    if (postUrgency < threshold) return false

    // Check platform
    if (conditions.platforms && !conditions.platforms.includes(post.platform)) {
      return false
    }

    return true
  }

  async createAlert(alertData: Omit<Alert, "id" | "created_at" | "acknowledged_by" | "resolved">): Promise<Alert> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...alertData,
      created_at: new Date().toISOString(),
      acknowledged_by: [],
      resolved: false,
    }

    // Store in database
    await supabase.from("alerts").insert(alert)

    // Broadcast real-time alert
    serverSocketManager.emit("priority_alert", alert)

    // Log the alert
    console.log(`🚨 Priority Alert Created: ${alert.title} (${alert.priority})`)

    return alert
  }

  private async executeRuleActions(alert: Alert, actions: AlertRule["actions"]) {
    // Notify users
    for (const userId of actions.notify_users) {
      await this.notifyUser(userId, alert)
    }

    // Auto-escalate if needed
    if (actions.auto_escalate && alert.priority !== "critical") {
      await this.escalateAlert(alert)
    }
  }

  private async notifyUser(userId: string, alert: Alert) {
    // Send notification to specific user
    serverSocketManager.emit(`user:${userId}:alert`, alert)

    // In a real implementation, you might also send:
    // - Email notifications
    // - SMS alerts
    // - Push notifications
    // - Slack/Discord webhooks
  }

  private async escalateAlert(alert: Alert) {
    // Escalate alert priority
    const escalatedAlert = {
      ...alert,
      priority: "critical" as const,
      title: `ESCALATED: ${alert.title}`,
    }

    await supabase.from("alerts").update(escalatedAlert).eq("id", alert.id)
    serverSocketManager.emit("alert_escalated", escalatedAlert)
  }

  async getActiveAlerts(): Promise<Alert[]> {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("resolved", false)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching alerts:", error)
      return []
    }

    return data || []
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const { data: alert } = await supabase
      .from("alerts")
      .select("acknowledged_by")
      .eq("id", alertId)
      .single()

    if (alert) {
      const acknowledgedBy = alert.acknowledged_by || []
      if (!acknowledgedBy.includes(userId)) {
        acknowledgedBy.push(userId)

        await supabase
          .from("alerts")
          .update({ acknowledged_by: acknowledgedBy })
          .eq("id", alertId)
      }
    }
  }

  async resolveAlert(alertId: string, userId: string): Promise<void> {
    await supabase
      .from("alerts")
      .update({
        resolved: true,
        acknowledged_by: [userId]
      })
      .eq("id", alertId)

    serverSocketManager.emit("alert_resolved", { alertId, resolvedBy: userId })
  }
}

export const alertingService = new AlertingService()
