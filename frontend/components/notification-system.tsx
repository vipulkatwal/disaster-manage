"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Bell, AlertTriangle, CheckCircle, Info, Settings } from "lucide-react"
import { socketManager } from "@/lib/socket"

interface Notification {
  id: string
  type: "disaster" | "resource" | "social" | "system" | "alert"
  title: string
  message: string
  priority: "low" | "medium" | "high" | "critical"
  timestamp: string
  read: boolean
  actionUrl?: string
  data?: any
}

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [settings, setSettings] = useState({
    disasters: true,
    resources: true,
    social: false,
    system: false,
    criticalOnly: false,
  })

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    // Load existing notifications
    loadNotifications()

    // Set up real-time notification listeners
    const handleDisasterUpdate = (data: any) => {
      if (settings.disasters && (!settings.criticalOnly || data.priority === "critical")) {
        addNotification({
          type: "disaster",
          title: "Disaster Updated",
          message: `${data.title} has been updated`,
          priority: data.priority,
          data,
        })
      }
    }

    const handleResourceUpdate = (data: any) => {
      if (settings.resources) {
        addNotification({
          type: "resource",
          title: "Resource Updated",
          message: `${data.name} status changed to ${data.status}`,
          priority: "medium",
          data,
        })
      }
    }

    const handleSocialUpdate = (data: any) => {
      if (settings.social && data.urgency === "critical") {
        addNotification({
          type: "social",
          title: "Urgent Social Media Alert",
          message: `High-priority post detected: ${data.content.slice(0, 50)}...`,
          priority: "high",
          data,
        })
      }
    }

    socketManager.on("disaster_updated", handleDisasterUpdate)
    socketManager.on("resources_updated", handleResourceUpdate)
    socketManager.on("social_media_updated", handleSocialUpdate)

    return () => {
      socketManager.off("disaster_updated", handleDisasterUpdate)
      socketManager.off("resources_updated", handleResourceUpdate)
      socketManager.off("social_media_updated", handleSocialUpdate)
    }
  }, [settings])

  const loadNotifications = () => {
    // Load from localStorage or API
    const stored = localStorage.getItem("disaster_notifications")
    if (stored) {
      setNotifications(JSON.parse(stored))
    }
  }

  const addNotification = (notificationData: Omit<Notification, "id" | "timestamp" | "read">) => {
    const notification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
    }

    setNotifications((prev) => [notification, ...prev.slice(0, 49)]) // Keep 50 most recent

    // Show browser notification for critical alerts
    if (notification.priority === "critical" && "Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/disaster-icon.png",
        tag: notification.id,
      })
    }

    // Save to localStorage
    setTimeout(() => {
      const current = JSON.parse(localStorage.getItem("disaster_notifications") || "[]")
      localStorage.setItem("disaster_notifications", JSON.stringify([notification, ...current.slice(0, 49)]))
    }, 100)
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
    localStorage.removeItem("disaster_notifications")
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "disaster":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "resource":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "social":
        return <Info className="h-4 w-4 text-blue-600" />
      case "system":
        return <Settings className="h-4 w-4 text-gray-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-600 text-white"
      case "high":
        return "bg-orange-600 text-white"
      case "medium":
        return "bg-yellow-600 text-white"
      case "low":
        return "bg-green-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button variant="outline" size="sm" onClick={() => setShowNotifications(!showNotifications)} className="relative">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-600 text-white text-xs">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="absolute right-0 top-12 w-96 max-h-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear all
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowNotifications(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                          <Badge className={`${getPriorityColor(notification.priority)} text-xs`}>
                            {notification.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                        <p className="text-xs text-gray-500">{new Date(notification.timestamp).toLocaleString()}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-600 mb-2">Notification Settings:</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(settings).map(([key, enabled]) => (
                <Button
                  key={key}
                  variant={enabled ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => setSettings((prev) => ({ ...prev, [key]: !enabled }))}
                >
                  {key}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
