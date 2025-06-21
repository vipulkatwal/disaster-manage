"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { MapPin, Navigation, Phone, Clock, Users } from "lucide-react"
import { getNearbyResources, type Resource } from "../lib/api"
import { socketManager } from "../lib/socket"
import ResourcesMapView from "./resources-map-view"

// Debounce hook for search operations
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function ResourcesMap() {
  const [resources, setResources] = useState<Resource[]>([])
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [searchLocation, setSearchLocation] = useState("")
  const [loading, setLoading] = useState(true)

  // Debounce search input to reduce filtering operations
  const debouncedSearchLocation = useDebounce(searchLocation, 300)

  // Memoize the resource update handler
  const handleResourceUpdate = useCallback((data: any) => {
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
  }, [])

  useEffect(() => {
    loadResources()

    // Set up real-time updates
    socketManager.on("resources_updated", handleResourceUpdate)

    return () => {
      socketManager.off("resources_updated", handleResourceUpdate)
    }
  }, [handleResourceUpdate])

  // Memoize filtered resources to prevent unnecessary re-computations
  const filteredResources = useMemo(() => {
    let filtered = resources

    if (selectedType) {
      filtered = filtered.filter((resource) => resource.type === selectedType)
    }

    if (debouncedSearchLocation) {
      filtered = filtered.filter(
        (resource) =>
          resource.location_name.toLowerCase().includes(debouncedSearchLocation.toLowerCase()) ||
          resource.name.toLowerCase().includes(debouncedSearchLocation.toLowerCase()),
      )
    }

    return filtered
  }, [resources, selectedType, debouncedSearchLocation])

  const loadResources = useCallback(async () => {
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
  }, [])

  // Memoize utility functions
  const getTypeColor = useCallback((type: string) => {
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
  }, [])

  const getStatusColor = useCallback((status: string) => {
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
  }, [])

  // Memoize resource types to prevent re-renders
  const resourceTypes = useMemo(() => ["shelter", "medical", "food", "supplies", "evacuation"], [])

  // Memoize type buttons to prevent re-renders
  const typeButtons = useMemo(() => [
    {
      key: "all",
      label: "All Types",
      type: null,
      variant: selectedType === null ? "default" : "outline",
    },
    ...resourceTypes.map((type) => ({
      key: type,
      label: type,
      type,
      variant: selectedType === type ? "default" : "outline",
    })),
  ], [selectedType, resourceTypes])

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
          {typeButtons.map((button) => (
            <Button
              key={button.key}
              variant={button.variant as any}
              size="sm"
              onClick={() => setSelectedType(button.type)}
            >
              {button.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Map Placeholder */}
      <ResourcesMapView resources={filteredResources} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredResources.map((resource) => (
          <Card
            key={resource.id}
            className="bg-white/80 rounded-2xl border border-pink-100 shadow-md transition-all duration-200 hover:bg-white/90 hover:shadow-xl hover:border-pink-400 hover:scale-[1.01]"
          >
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-gray-900">{resource.name}</h3>
                  <Badge className={getTypeColor(resource.type)}>{resource.type}</Badge>
                  <Badge variant="outline" className={getStatusColor(resource.status)}>
                    {resource.status}
                  </Badge>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  {resource.location_name}
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <Phone className="h-4 w-4 mr-1" />
                  {resource.contact}
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  {resource.hours}
                </div>
                {resource.capacity && (
                  <div className="flex items-center text-xs text-gray-600">
                    <Users className="h-4 w-4 mr-1" />
                    {resource.current_occupancy}/{resource.capacity} occupied
                  </div>
                )}
                {resource.services && resource.services.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Services:</p>
                    <div className="flex flex-wrap gap-1">
                      {resource.services.map((service) => (
                        <Badge key={service} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Navigation className="h-4 w-4 mr-1" />
                    Get Directions
                  </Button>
                  <Button size="sm" variant="outline">
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
