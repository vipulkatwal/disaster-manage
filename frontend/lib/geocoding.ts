// Step 5: Geocoding Utility
import { getFromCache, setCache } from "./cache"

interface Coordinates {
  lat: number
  lng: number
}

export async function convertLocationToLatLng(locationName: string): Promise<Coordinates | null> {
  const cacheKey = `geocode:${locationName.toLowerCase()}`

  // Check cache first
  const cached = await getFromCache(cacheKey)
  if (cached) return cached

  try {
    // Using Nominatim (OpenStreetMap) as free alternative
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`,
      {
        headers: {
          "User-Agent": "DisasterResponsePlatform/1.0",
        },
      },
    )

    const data = await response.json()

    if (data && data.length > 0) {
      const coordinates = {
        lat: Number.parseFloat(data[0].lat),
        lng: Number.parseFloat(data[0].lon),
      }

      // Cache the result
      await setCache(cacheKey, coordinates, 24) // Cache for 24 hours
      return coordinates
    }

    return null
  } catch (error) {
    console.error("Geocoding error:", error)
    return null
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const cacheKey = `reverse:${lat},${lng}`

  // Check cache first
  const cached = await getFromCache(cacheKey)
  if (cached) return cached

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
      headers: {
        "User-Agent": "DisasterResponsePlatform/1.0",
      },
    })

    const data = await response.json()
    const address = data.display_name || null

    if (address) {
      await setCache(cacheKey, address, 24)
    }

    return address
  } catch (error) {
    console.error("Reverse geocoding error:", error)
    return null
  }
}
