"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Bell, AlertTriangle, CheckCircle, X, Clock } from "lucide-react"
import { socketManager } from "../lib/socket"

interface Alert {
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

export default function NotificationSystem() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadAlerts()
    setupSocketListeners()

    return () => {
      socketManager.off("priority_alert", handleNewAlert)
      socketManager.off("alert_escalated", handleAlertEscalated)
      socketManager.off("alert_resolved", handleAlertResolved)
    }
  }, [])

  const loadAlerts = async () => {
    try {
      const response = await fetch("/api/alerts?resolved=false")
      const data = await response.json()
      setAlerts(data)
      setUnreadCount(data.filter((alert: Alert) => !alert.acknowledged_by?.length).length)
    } catch (error) {
      console.error("Failed to load alerts:", error)
    }
  }

  const setupSocketListeners = () => {
    socketManager.on("priority_alert", handleNewAlert)
    socketManager.on("alert_escalated", handleAlertEscalated)
    socketManager.on("alert_resolved", handleAlertResolved)
  }

  const handleNewAlert = (alert: Alert) => {
    setAlerts(prev => [alert, ...prev])
    setUnreadCount(prev => prev + 1)

    // Show browser notification for critical alerts
    if (alert.priority === "critical" && "Notification" in window) {
      new Notification("🚨 Critical Alert", {
        body: alert.title,
        icon: "/placeholder-logo.png"
      })
    }
  }

  const handleAlertEscalated = (data: { alertId: string; escalatedAlert: Alert }) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === data.alertId ? data.escalatedAlert : alert
    ))
  }

  const handleAlertResolved = (data: { alertId: string; resolvedBy: string }) => {
    setAlerts(prev => prev.filter(alert => alert.id !== data.alertId))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}/acknowledge`, { method: "POST" })
      setAlerts(prev => prev.map(alert =>
        alert.id === alertId
          ? { ...alert, acknowledged_by: [...(alert.acknowledged_by || []), "current_user"] }
          : alert
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Failed to acknowledge alert:", error)
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}/resolve`, { method: "POST" })
      setAlerts(prev => prev.filter(alert => alert.id !== alertId))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Failed to resolve alert:", error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-600 text-white"
      case "high": return "bg-orange-600 text-white"
      case "medium": return "bg-yellow-600 text-white"
      case "low": return "bg-blue-600 text-white"
      default: return "bg-gray-600 text-white"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "social_media": return <Bell className="h-4 w-4" />
      case "disaster": return <AlertTriangle className="h-4 w-4" />
      case "resource": return <CheckCircle className="h-4 w-4" />
      case "system": return <Clock className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {showNotifications && (
        <Card className="absolute right-0 top-12 w-96 z-50 max-h-96 overflow-y-auto">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              Priority Alerts
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No active alerts</p>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.priority === "critical"
                      ? "border-red-200 bg-red-50"
                      : alert.priority === "high"
                      ? "border-orange-200 bg-orange-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(alert.type)}
                      <Badge className={getPriorityColor(alert.priority)}>
                        {alert.priority}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <h4 className="font-semibold text-sm mb-1">{alert.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{alert.message}</p>

                  {alert.source && (
                    <p className="text-xs text-gray-500 mb-2">Source: {alert.source}</p>
                  )}

                  {alert.location?.name && (
                    <p className="text-xs text-gray-500 mb-2">Location: {alert.location.name}</p>
                  )}

                  <div className="flex gap-2">
                    {!alert.acknowledged_by?.length && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
