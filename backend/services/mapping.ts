// Enhanced Mapping Service with Google Maps Integration
import { getFromCache, setCache } from "./cache"

interface MapResource {
  id: string
  name: string
  type: "hospital" | "shelter" | "police" | "fire_station" | "pharmacy" | "gas_station"
  location: {
    lat: number
    lng: number
  }
  address: string
  phone?: string
  rating?: number
  open_now?: boolean
  distance?: number
}

interface NearbySearchParams {
  lat: number
  lng: number
  radius: number
  types: string[]
  keyword?: string
}

class MappingService {
  private googleMapsApiKey: string

  constructor() {
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || ""
  }

  async findNearbyResources(params: NearbySearchParams): Promise<MapResource[]> {
    const cacheKey = `nearby_resources:${params.lat},${params.lng},${params.radius},${params.types.join(",")}`

    // Check cache first
    const cached = await getFromCache(cacheKey)
    if (cached) return cached

    if (!this.googleMapsApiKey) {
      // Fallback to mock data if no API key
      return this.getMockResources(params)
    }

    try {
      const resources: MapResource[] = []

      for (const type of params.types) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
          `location=${params.lat},${params.lng}&radius=${params.radius}&type=${type}` +
          `&key=${this.googleMapsApiKey}`
        )

        const data = await response.json()

        if (data.results) {
          const typeResources = data.results.map((place: any) => ({
            id: place.place_id,
            name: place.name,
            type: this.mapGoogleTypeToResourceType(type),
            location: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
            },
            address: place.vicinity,
            rating: place.rating,
            open_now: place.opening_hours?.open_now,
            distance: this.calculateDistance(
              params.lat, params.lng,
              place.geometry.location.lat,
              place.geometry.location.lng
            ),
          }))

          resources.push(...typeResources)
        }
      }

      // Sort by distance
      resources.sort((a, b) => (a.distance || 0) - (b.distance || 0))

      // Cache for 1 hour
      await setCache(cacheKey, resources, 1)
      return resources

    } catch (error) {
      console.error("Google Maps API error:", error)
      return this.getMockResources(params)
    }
  }

  private mapGoogleTypeToResourceType(googleType: string): MapResource["type"] {
    const typeMap: Record<string, MapResource["type"]> = {
      hospital: "hospital",
      police: "police",
      fire_station: "fire_station",
      pharmacy: "pharmacy",
      gas_station: "gas_station",
    }
    return typeMap[googleType] || "shelter"
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180)
  }

  private getMockResources(params: NearbySearchParams): MapResource[] {
    const mockResources: MapResource[] = [
      {
        id: "mock_hospital_1",
        name: "Emergency Medical Center",
        type: "hospital",
        location: {
          lat: params.lat + (Math.random() - 0.5) * 0.01,
          lng: params.lng + (Math.random() - 0.5) * 0.01,
        },
        address: "123 Emergency St, Disaster City",
        phone: "+1-555-EMERGENCY",
        rating: 4.5,
        open_now: true,
        distance: Math.random() * 5,
      },
      {
        id: "mock_shelter_1",
        name: "Community Emergency Shelter",
        type: "shelter",
        location: {
          lat: params.lat + (Math.random() - 0.5) * 0.01,
          lng: params.lng + (Math.random() - 0.5) * 0.01,
        },
        address: "456 Safety Ave, Disaster City",
        phone: "+1-555-SHELTER",
        rating: 4.2,
        open_now: true,
        distance: Math.random() * 3,
      },
      {
        id: "mock_police_1",
        name: "Emergency Response Police Station",
        type: "police",
        location: {
          lat: params.lat + (Math.random() - 0.5) * 0.01,
          lng: params.lng + (Math.random() - 0.5) * 0.01,
        },
        address: "789 Security Blvd, Disaster City",
        phone: "+1-555-POLICE",
        rating: 4.0,
        open_now: true,
        distance: Math.random() * 4,
      },
    ]

    return mockResources.sort((a, b) => (a.distance || 0) - (b.distance || 0))
  }

  async getDirections(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) {
    if (!this.googleMapsApiKey) {
      return this.getMockDirections(origin, destination)
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}` +
        `&key=${this.googleMapsApiKey}`
      )

      const data = await response.json()
      return data.routes?.[0] || null
    } catch (error) {
      console.error("Directions API error:", error)
      return this.getMockDirections(origin, destination)
    }
  }

  private getMockDirections(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) {
    const distance = this.calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng)
    return {
      distance: { text: `${distance.toFixed(1)} km`, value: distance * 1000 },
      duration: { text: `${Math.round(distance * 2)} mins`, value: distance * 2 * 60 },
      polyline: { points: "mock_polyline_data" },
    }
  }
}

export const mappingService = new MappingService()