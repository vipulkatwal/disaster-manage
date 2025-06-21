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

  return (
    <div className="space-y-4">
      {!limit && (
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search disasters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>
      )}

      <div className="space-y-4">
        {filteredDisasters.map((disaster) =>
          editingDisaster?.id === disaster.id ? (
            <Card key={disaster.id} className="bg-gray-50">
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
            <Card key={disaster.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{disaster.title}</h3>
                      <Badge className={getPriorityColor(disaster.priority)}>{disaster.priority}</Badge>
                      <Badge variant="outline" className={getStatusColor(disaster.status)}>
                        {disaster.status}
                      </Badge>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {disaster.location_name}
                    </div>

                    <p className="text-gray-700 mb-3">{disaster.description}</p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {disaster.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {getVerificationIcon(disaster.verification_status)}
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(disaster)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(disaster.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{disaster.owner_id}</span>
                    <Clock className="h-4 w-4 ml-2" />
                    <span>{new Date(disaster.created_at).toLocaleString()}</span>
                  </div>

                  {disaster.status !== "resolved" && (
                    <div className="flex items-center gap-2">
                      {disaster.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(disaster.id, "monitoring")}
                        >
                          Mark Monitoring
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(disaster.id, "resolved")}
                        className="text-green-600 hover:text-green-700"
                      >
                        Mark Resolved
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  )
}
