// Step 11: Frontend API Layer
export interface Disaster {
  id: string
  title: string
  location_name: string
  description: string
  tags: string[]
  status: "active" | "resolved" | "monitoring"
  priority: "low" | "medium" | "high" | "critical"
  owner_id: string
  verification_status: "pending" | "verified" | "suspicious"
  created_at: string
  updated_at: string
}

export interface SocialPost {
  id: string
  platform: string
  author: string
  content: string
  timestamp: string
  engagement: {
    likes: number
    shares: number
    comments: number
  }
  urgency: "low" | "medium" | "high" | "critical"
  verified: boolean
  location?: string
  hashtags: string[]
}

export interface Resource {
  id: string
  disaster_id: string
  name: string
  type: "shelter" | "medical" | "food" | "supplies" | "evacuation"
  location_name: string
  status: "available" | "full" | "closed"
  capacity?: number
  current_occupancy?: number
  contact: string
  hours: string
  services: string[]
}

export async function fetchDisasters(filters?: {
  tag?: string
  status?: string
  priority?: string
}): Promise<Disaster[]> {
  const params = new URLSearchParams()
  if (filters?.tag) params.append("tag", filters.tag)
  if (filters?.status) params.append("status", filters.status)
  if (filters?.priority) params.append("priority", filters.priority)

  const response = await fetch(`/api/disasters?${params}`)
  if (!response.ok) throw new Error("Failed to fetch disasters")
  return response.json()
}

export async function postDisaster(data: {
  title: string
  location_name: string
  description: string
  tags?: string[]
  priority?: string
}): Promise<Disaster> {
  const response = await fetch("/api/disasters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error("Failed to create disaster")
  return response.json()
}

export async function updateDisaster(id: string, data: Partial<Disaster>): Promise<Disaster> {
  const response = await fetch(`/api/disasters/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error("Failed to update disaster")
  return response.json()
}

export async function deleteDisaster(id: string): Promise<void> {
  const response = await fetch(`/api/disasters/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) throw new Error("Failed to delete disaster")
}

export async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  const response = await fetch("/api/geocode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location }),
  })
  if (!response.ok) throw new Error("Failed to geocode location")
  return response.json()
}

export async function getSocialMedia(disasterId: string): Promise<SocialPost[]> {
  const response = await fetch(`/api/disasters/${disasterId}/social-media`)
  if (!response.ok) throw new Error("Failed to fetch social media")
  return response.json()
}

export async function getNearbyResources(
  disasterId: string,
  lat?: number,
  lon?: number,
  radius?: number,
): Promise<Resource[]> {
  const params = new URLSearchParams()
  if (lat) params.append("lat", lat.toString())
  if (lon) params.append("lon", lon.toString())
  if (radius) params.append("radius", radius.toString())

  const response = await fetch(`/api/disasters/${disasterId}/resources?${params}`)
  if (!response.ok) throw new Error("Failed to fetch resources")
  return response.json()
}

export async function verifyImage(
  disasterId: string,
  imageUrl: string,
): Promise<{
  isAuthentic: boolean
  confidence: number
  reasoning: string
  status: string
}> {
  const response = await fetch(`/api/disasters/${disasterId}/verify-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl }),
  })
  if (!response.ok) throw new Error("Failed to verify image")
  return response.json()
}
