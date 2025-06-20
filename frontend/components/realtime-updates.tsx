"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Clock, Zap, AlertTriangle, CheckCircle, Users } from "lucide-react"
import { socketManager } from "@/lib/socket"

interface RealtimeUpdate {
  id: string
  type: "disaster" | "resource" | "social" | "system"
  message: string
  timestamp: string
  priority: "low" | "medium" | "high" | "critical"
}

export default function RealtimeUpdates() {
  const [updates, setUpdates] = useState<RealtimeUpdate[]>([])

  useEffect(() => {
    // Initial updates
    const initialUpdates: RealtimeUpdate[] = [
      {
        id: "1",
        type: "disaster",
        message: "New flood report verified in Lower Manhattan",
        timestamp: new Date().toISOString(),
        priority: "critical",
      },
      {
        id: "2",
        type: "resource",
        message: "Brooklyn Community Shelter capacity updated: 145/200",
        timestamp: new Date(Date.now() - 120000).toISOString(),
        priority: "medium",
      },
      {
        id: "3",
        type: "social",
        message: "High-priority social media posts detected: 12 new urgent reports",
        timestamp: new Date(Date.now() - 180000).toISOString(),
        priority: "high",
      },
    ]

    setUpdates(initialUpdates)

    // Set up real-time updates from socket
    const handleUpdate = (data: any) => {
      const newUpdate: RealtimeUpdate = {
        id: Date.now().toString(),
        type: data.type || "system",
        message: data.message || "System update received",
        timestamp: new Date().toISOString(),
        priority: data.priority || "medium",
      }

      setUpdates((prev) => [newUpdate, ...prev.slice(0, 9)]) // Keep only 10 most recent
    }

    socketManager.on("disaster_updated", (data) =>
      handleUpdate({
        type: "disaster",
        message: `Disaster "${data.title}" has been updated`,
        priority: data.priority,
      }),
    )

    socketManager.on("social_media_updated", (data) =>
      handleUpdate({
        type: "social",
        message: `New ${data.urgency} priority social media post detected`,
        priority: data.urgency,
      }),
    )

    socketManager.on("resources_updated", (data) =>
      handleUpdate({
        type: "resource",
        message: `Resource "${data.name}" status updated to ${data.status}`,
        priority: "medium",
      }),
    )

    // Simulate periodic updates
    const interval = setInterval(() => {
      const newUpdate: RealtimeUpdate = {
        id: Date.now().toString(),
        type: ["disaster", "resource", "social", "system"][Math.floor(Math.random() * 4)] as any,
        message: getRandomMessage(),
        timestamp: new Date().toISOString(),
        priority: ["low", "medium", "high", "critical"][Math.floor(Math.random() * 4)] as any,
      }

      setUpdates((prev) => [newUpdate, ...prev.slice(0, 9)])
    }, 15000) // New update every 15 seconds

    return () => {
      clearInterval(interval)
      socketManager.off("disaster_updated", handleUpdate)
      socketManager.off("social_media_updated", handleUpdate)
      socketManager.off("resources_updated", handleUpdate)
    }
  }, [])

  const getRandomMessage = () => {
    const messages = [
      "Emergency services dispatched to Queens power outage",
      "Social media verification completed for 5 new reports",
      "Resource allocation updated for Staten Island evacuation center",
      "AI analysis detected potential misinformation in 3 posts",
      "New shelter opened in Brooklyn - capacity 150",
      "Weather alert: Heavy rain expected in next 2 hours",
      "Medical team deployed to Bronx emergency site",
      "Supply distribution completed at 4 locations",
      "System backup completed successfully",
      "Geocoding service processed 47 new location requests",
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "disaster":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "resource":
        return <Users className="h-4 w-4 text-blue-600" />
      case "social":
        return <Zap className="h-4 w-4 text-purple-600" />
      case "system":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
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

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {updates.map((update) => (
        <div key={update.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0 mt-0.5">{getTypeIcon(update.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${getPriorityColor(update.priority)} text-xs`}>{update.priority}</Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {update.type}
              </Badge>
            </div>
            <p className="text-sm text-gray-800 mb-1">{update.message}</p>
            <p className="text-xs text-gray-500">{new Date(update.timestamp).toLocaleTimeString()}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
