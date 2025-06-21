"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { MapPin, Clock, User, CheckCircle, XCircle, Edit, Trash2 } from "lucide-react"
import { fetchDisasters, updateDisaster, deleteDisaster, type Disaster } from "../lib/api"
import { socketManager } from "../lib/socket"

interface DisasterListProps {
  limit?: number
}

export default function DisasterList({ limit }: DisasterListProps) {
  const [disasters, setDisasters] = useState<Disaster[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [editingDisaster, setEditingDisaster] = useState<Partial<Disaster> | null>(null)

  const loadDisasters = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchDisasters()
      const filtered = limit ? data.slice(0, limit) : data;
      setDisasters(filtered)
    } catch (error) {
      console.error("Failed to load disasters:", error)
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    loadDisasters()

    // Listen for real-time updates and refetch the entire list
    const handleUpdate = () => {
      loadDisasters()
    }

    socketManager.on("disaster_updated", handleUpdate)

    return () => {
      socketManager.off("disaster_updated", handleUpdate)
    }
  }, [loadDisasters])

  const handleEdit = (disaster: Disaster) => {
    setEditingDisaster({ ...disaster })
  }

  const handleCancelEdit = () => {
    setEditingDisaster(null)
  }

  const handleSaveEdit = async () => {
    if (!editingDisaster || !editingDisaster.id) return
    try {
      const payload = {
        title: editingDisaster.title,
        description: editingDisaster.description,
      }
      await updateDisaster(editingDisaster.id, payload)
      setEditingDisaster(null)
      // No manual refetch needed, socket will trigger it
    } catch (error) {
      console.error("Failed to update disaster:", error)
    }
  }

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await updateDisaster(id, { status: status as any })
      // No manual refetch needed, socket will trigger it
    } catch (error) {
      console.error("Failed to update disaster:", error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this disaster report?")) return
    try {
      await deleteDisaster(id)
      // No manual refetch needed, socket will trigger it
    } catch (error) {
      console.error("Failed to delete disaster:", error)
    }
  }

  // Filter logic now operates on the master 'disasters' list
  const filteredDisasters = disasters.filter(disaster =>
    disaster.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    disaster.location_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-100 text-red-800 border-red-200"
      case "monitoring":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "suspicious":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const allTags = Array.from(new Set(disasters.flatMap((d) => d.tags)))
  const allStatuses = ["active", "monitoring", "resolved"]

  if (loading) {
    return <div className="text-center py-8">Loading disasters...</div>
  }

  // If limit is set, render as a compact dashboard card (already handled above). If not, wrap in a premium glassy container.
  if (limit) {
    return (
      <div className="h-[500px] overflow-y-auto px-3 py-4 rounded-2xl bg-white/70 backdrop-blur-[2px] border border-pink-100 shadow-inner flex flex-col gap-6">
        {filteredDisasters.map((disaster) =>
          editingDisaster?.id === disaster.id ? (
            <Card key={disaster.id} className="bg-white/90 rounded-xl border border-pink-100 shadow-md">
              <CardContent className="p-6 space-y-4">
                <Input
                  value={editingDisaster.title || ""}
                  onChange={(e) => setEditingDisaster({ ...editingDisaster, title: e.target.value })}
                  className="text-lg font-semibold"
                />
                <Input
                  value={editingDisaster.description || ""}
                  onChange={(e) => setEditingDisaster({ ...editingDisaster, description: e.target.value })}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit}>Save</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card
              key={disaster.id}
              className="bg-white/80 rounded-xl border border-pink-100 shadow-md transition-all duration-200 group hover:bg-white/90 hover:shadow-xl hover:border-pink-400 hover:scale-[1.01]"
            >
              <CardContent className="p-6 relative flex flex-col gap-2">
                {/* Action buttons: top right, outside title/badges row */}
                <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
                  <Button size="icon" variant="ghost" className="hover:bg-pink-100 hover:text-pink-600 transition-colors">
                    <Edit className="h-5 w-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="hover:bg-red-100 hover:text-red-600 transition-colors">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
                {/* Title row */}
                <div className="flex flex-col gap-2 mb-3 mt-2">
                  <h3 className="text-xl font-bold text-gray-900 mr-2 pr-16">{disaster.title}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getPriorityColor(disaster.priority) + " group-hover:brightness-110 group-hover:scale-105 transition-all"}>{disaster.priority}</Badge>
                    <Badge variant="outline" className={getStatusColor(disaster.status) + " border-pink-200 group-hover:border-pink-400 transition-all"}>
                      {disaster.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  {disaster.location_name}
                </div>
                <p className="text-base text-gray-800 mb-4 group-hover:text-pink-700 transition-colors leading-relaxed">{disaster.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {disaster.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
                {/* User info and status buttons: only once, at the bottom left */}
                <div className="flex items-center text-xs text-gray-500 gap-2 mt-auto">
                  <User className="h-4 w-4" />
                  {disaster.owner_id || "reliefAdmin"}
                  <Clock className="h-4 w-4 ml-2" />
                  {new Date(disaster.created_at).toLocaleString()}
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={() => handleStatusUpdate(disaster.id, "monitoring")}
                  >
                    Mark Monitoring
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 text-green-700 border-green-200 bg-green-50 hover:bg-green-100"
                    onClick={() => handleStatusUpdate(disaster.id, "resolved")}
                  >
                    Mark Resolved
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    )
  }

  // Full-page Disaster Management view (no limit): glassy, premium container
  return (
    <div className="w-full min-h-[600px] px-3 py-6 rounded-2xl bg-white/70 backdrop-blur-[2px] border border-pink-100 shadow-inner flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Input
          placeholder="Search disasters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 shadow-sm rounded-xl border border-pink-100 focus:border-pink-400 focus:ring-pink-200"
        />
      </div>
      <div className="flex flex-col gap-6">
        {filteredDisasters.map((disaster) =>
          editingDisaster?.id === disaster.id ? (
            <Card key={disaster.id} className="bg-white/90 rounded-xl border border-pink-100 shadow-md">
              <CardContent className="p-6 space-y-4">
                <Input
                  value={editingDisaster.title || ""}
                  onChange={(e) => setEditingDisaster({ ...editingDisaster, title: e.target.value })}
                  className="text-lg font-semibold"
                />
                <Input
                  value={editingDisaster.description || ""}
                  onChange={(e) => setEditingDisaster({ ...editingDisaster, description: e.target.value })}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit}>Save</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card
              key={disaster.id}
              className="bg-white/80 rounded-xl border border-pink-100 shadow-md transition-all duration-200 group hover:bg-white/90 hover:shadow-xl hover:border-pink-400 hover:scale-[1.01]"
            >
              <CardContent className="p-6 relative flex flex-col gap-2">
                {/* Action buttons: top right, outside title/badges row */}
                <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
                  <Button size="icon" variant="ghost" className="hover:bg-pink-100 hover:text-pink-600 transition-colors">
                    <Edit className="h-5 w-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="hover:bg-red-100 hover:text-red-600 transition-colors">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
                {/* Title row */}
                <div className="flex flex-col gap-2 mb-3 mt-2">
                  <h3 className="text-xl font-bold text-gray-900 mr-2 pr-16">{disaster.title}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getPriorityColor(disaster.priority) + " group-hover:brightness-110 group-hover:scale-105 transition-all"}>{disaster.priority}</Badge>
                    <Badge variant="outline" className={getStatusColor(disaster.status) + " border-pink-200 group-hover:border-pink-400 transition-all"}>
                      {disaster.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  {disaster.location_name}
                </div>
                <p className="text-base text-gray-800 mb-4 group-hover:text-pink-700 transition-colors leading-relaxed">{disaster.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {disaster.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
                {/* User info and status buttons: only once, at the bottom left */}
                <div className="flex items-center text-xs text-gray-500 gap-2 mt-auto">
                  <User className="h-4 w-4" />
                  {disaster.owner_id || "reliefAdmin"}
                  <Clock className="h-4 w-4 ml-2" />
                  {new Date(disaster.created_at).toLocaleString()}
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={() => handleStatusUpdate(disaster.id, "monitoring")}
                  >
                    Mark Monitoring
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 text-green-700 border-green-200 bg-green-50 hover:bg-green-100"
                    onClick={() => handleStatusUpdate(disaster.id, "resolved")}
                  >
                    Mark Resolved
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  )
}
