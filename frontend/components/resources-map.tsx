"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Navigation, Phone, Clock, Users } from "lucide-react"
import { getNearbyResources, type Resource } from "@/lib/api"
import { socketManager } from "@/lib/socket"
import ResourcesMapView from "@/components/resources-map-view"

export default function ResourcesMap() {
  const [resources, setResources] = useState<Resource[]>([])
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [searchLocation, setSearchLocation] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResources()

    // Set up real-time updates
    const handleResourceUpdate = (data: any) => {
      setResources((prev) => {
        const index = prev.findIndex((r) => r.id === data.id)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = data
          return updated
        } else {
          return [data, ...prev]
        }
      })
    }

    socketManager.on("resources_updated", handleResourceUpdate)

    return () => {
      socketManager.off("resources_updated", handleResourceUpdate)
    }
  }, [])

  useEffect(() => {
    let filtered = resources

    if (selectedType) {
      filtered = filtered.filter((resource) => resource.type === selectedType)
    }

    if (searchLocation) {
      filtered = filtered.filter(
        (resource) =>
          resource.location_name.toLowerCase().includes(searchLocation.toLowerCase()) ||
          resource.name.toLowerCase().includes(searchLocation.toLowerCase()),
      )
    }

    setFilteredResources(filtered)
  }, [resources, selectedType, searchLocation])

  const loadResources = async () => {
    try {
      setLoading(true)
      // For demo, we'll use a mock disaster ID
      const mockDisasterId = "demo-disaster-id"
      const data = await getNearbyResources(mockDisasterId)
      setResources(data)
    } catch (error) {
      console.error("Failed to load resources:", error)
      // Fallback to mock data
      setResources([
        {
          id: "1",
          disaster_id: "demo-disaster-id",
          name: "Brooklyn Community Shelter",
          type: "shelter",
          location_name: "123 Main St, Brooklyn, NY",
          status: "available",
          capacity: 200,
          current_occupancy: 145,
          contact: "(718) 555-0123",
          hours: "24/7",
          services: ["Emergency Housing", "Hot Meals", "Medical Care"],
        },
        {
          id: "2",
          disaster_id: "demo-disaster-id",
          name: "Manhattan Emergency Medical Center",
          type: "medical",
          location_name: "456 Hospital Ave, Manhattan, NY",
          status: "available",
          contact: "(212) 555-0456",
          hours: "24/7",
          services: ["Emergency Care", "Trauma Unit", "Pharmacy"],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "shelter":
        return "bg-blue-600 text-white"
      case "medical":
        return "bg-red-600 text-white"
      case "food":
        return "bg-green-600 text-white"
      case "supplies":
        return "bg-purple-600 text-white"
      case "evacuation":
        return "bg-orange-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200"
      case "full":
        return "bg-red-100 text-red-800 border-red-200"
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const resourceTypes = ["shelter", "medical", "food", "supplies", "evacuation"]

  if (loading) {
    return <div className="text-center py-8">Loading resources...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by location..."
          value={searchLocation}
          onChange={(e) => setSearchLocation(e.target.value)}
          className="flex-1"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedType === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType(null)}
          >
            All Types
          </Button>
          {resourceTypes.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(type)}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {/* Map Placeholder */}
      <ResourcesMapView resources={filteredResources} />

      <div className="space-y-4">
        {filteredResources.map((resource) => (
          <Card key={resource.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{resource.name}</h3>
                    <Badge className={getTypeColor(resource.type)}>{resource.type}</Badge>
                    <Badge variant="outline" className={getStatusColor(resource.status)}>
                      {resource.status}
                    </Badge>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {resource.location_name}
                  </div>

                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Phone className="h-4 w-4 mr-1" />
                    {resource.contact}
                  </div>

                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <Clock className="h-4 w-4 mr-1" />
                    {resource.hours}
                  </div>

                  {resource.capacity && (
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <Users className="h-4 w-4 mr-1" />
                      Capacity: {resource.current_occupancy}/{resource.capacity}
                      <div className="ml-2 flex-1 max-w-32">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(resource.current_occupancy! / resource.capacity) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {resource.services.map((service) => (
                      <Badge key={service} variant="secondary" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button variant="outline" size="sm" className="ml-4">
                  <Navigation className="h-4 w-4 mr-1" />
                  Directions
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
