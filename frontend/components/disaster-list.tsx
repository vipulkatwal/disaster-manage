"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Clock, User, CheckCircle, XCircle, Edit, Trash2 } from "lucide-react"
import { fetchDisasters, updateDisaster, deleteDisaster, type Disaster } from "@/lib/api"
import { socketManager } from "@/lib/socket"

interface DisasterListProps {
  limit?: number
  onRefresh?: () => void
}

export default function DisasterList({ limit, onRefresh }: DisasterListProps) {
  const [disasters, setDisasters] = useState<Disaster[]>([])
  const [filteredDisasters, setFilteredDisasters] = useState<Disaster[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDisasters()

    // Set up real-time updates
    const handleDisasterUpdate = (data: any) => {
      setDisasters((prev) => {
        const index = prev.findIndex((d) => d.id === data.id)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = data
          return updated
        } else {
          return [data, ...prev]
        }
      })
    }

    socketManager.on("disaster_updated", handleDisasterUpdate)

    return () => {
      socketManager.off("disaster_updated", handleDisasterUpdate)
    }
  }, [])

  useEffect(() => {
    let filtered = disasters

    if (searchTerm) {
      filtered = filtered.filter(
        (disaster) =>
          disaster.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          disaster.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          disaster.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedTag) {
      filtered = filtered.filter((disaster) => disaster.tags.includes(selectedTag))
    }

    if (selectedStatus) {
      filtered = filtered.filter((disaster) => disaster.status === selectedStatus)
    }

    setFilteredDisasters(limit ? filtered.slice(0, limit) : filtered)
  }, [disasters, searchTerm, selectedTag, selectedStatus, limit])

  const loadDisasters = async () => {
    try {
      setLoading(true)
      const data = await fetchDisasters()
      setDisasters(data)
    } catch (error) {
      console.error("Failed to load disasters:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateDisaster(id, { status: status as any })
      onRefresh?.()
    } catch (error) {
      console.error("Failed to update disaster:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this disaster report?")) return

    try {
      await deleteDisaster(id)
      setDisasters((prev) => prev.filter((d) => d.id !== id))
      onRefresh?.()
    } catch (error) {
      console.error("Failed to delete disaster:", error)
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
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTag === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTag(null)}
            >
              All Tags
            </Button>
            {allTags.map((tag) => (
              <Button
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedStatus === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus(null)}
            >
              All Status
            </Button>
            {allStatuses.map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredDisasters.map((disaster) => (
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
                    <Button variant="outline" size="sm">
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
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {disaster.owner_id}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(disaster.created_at).toLocaleString()}
                  </div>
                  {disaster.status === "active" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(disaster.id, "monitoring")}>
                        Mark Monitoring
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(disaster.id, "resolved")}
                        className="text-green-600 hover:text-green-700"
                      >
                        Mark Resolved
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
