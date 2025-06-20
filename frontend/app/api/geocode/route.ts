import { type NextRequest, NextResponse } from "next/server"
import { convertLocationToLatLng, reverseGeocode } from "@/lib/geocoding"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { location, lat, lng } = body

    if (location) {
      // Forward geocoding
      const coordinates = await convertLocationToLatLng(location)
      return NextResponse.json(coordinates)
    } else if (lat && lng) {
      // Reverse geocoding
      const address = await reverseGeocode(lat, lng)
      return NextResponse.json({ address })
    } else {
      return NextResponse.json({ error: "Location or coordinates required" }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
