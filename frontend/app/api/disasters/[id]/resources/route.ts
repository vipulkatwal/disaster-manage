import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const dummyResources = [
  {
    id: "demo-resource-1",
    disaster_id: "demo-disaster-id",
    name: "NYC Community Shelter",
    type: "shelter",
    location_name: "123 Broadway, New York, NY",
    status: "available",
    capacity: 100,
    current_occupancy: 42,
    contact: "(212) 123-4567",
    hours: "24/7",
    services: ["Emergency Housing", "Hot Meals"],
    location: { type: "Point", coordinates: [-74.006, 40.7128] },
  },
  {
    id: "demo-resource-2",
    disaster_id: "demo-disaster-id",
    name: "LA Medical Center",
    type: "medical",
    location_name: "456 Sunset Blvd, Los Angeles, CA",
    status: "available",
    capacity: 50,
    current_occupancy: 10,
    contact: "(310) 987-6543",
    hours: "8am-8pm",
    services: ["Emergency Care", "Pharmacy"],
    location: { type: "Point", coordinates: [-118.2437, 34.0522] },
  },
  {
    id: "demo-resource-3",
    disaster_id: "demo-disaster-id",
    name: "Chicago Food Bank",
    type: "food",
    location_name: "789 W Madison St, Chicago, IL",
    status: "available",
    capacity: 300,
    current_occupancy: 120,
    contact: "(312) 222-3333",
    hours: "10am-6pm",
    services: ["Food Distribution", "Water Bottles"],
    location: { type: "Point", coordinates: [-87.6298, 41.8781] },
  },
  {
    id: "demo-resource-4",
    disaster_id: "demo-disaster-id",
    name: "Houston Supply Depot",
    type: "supplies",
    location_name: "321 Main St, Houston, TX",
    status: "available",
    capacity: 500,
    current_occupancy: 200,
    contact: "(713) 444-5555",
    hours: "9am-9pm",
    services: ["Blankets", "Clothing", "Hygiene Kits"],
    location: { type: "Point", coordinates: [-95.3698, 29.7604] },
  },
  {
    id: "demo-resource-5",
    disaster_id: "demo-disaster-id",
    name: "Miami Evacuation Point",
    type: "evacuation",
    location_name: "654 Ocean Dr, Miami, FL",
    status: "available",
    capacity: 1000,
    current_occupancy: 300,
    contact: "(305) 666-7777",
    hours: "24/7",
    services: ["Bus Pickup", "Safe Zone"],
    location: { type: "Point", coordinates: [-80.1918, 25.7617] },
  },
]

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (params.id === "demo-disaster-id") {
      return NextResponse.json(dummyResources)
    }
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")
    const radius = searchParams.get("radius") || "10000" // 10km default

    let query = supabase.from("resources").select("*").eq("disaster_id", params.id)

    // If coordinates provided, order by distance
    if (lat && lon) {
      query = query.rpc("nearby_resources", {
        lat: Number.parseFloat(lat),
        lon: Number.parseFloat(lon),
        radius_meters: Number.parseInt(radius),
      })
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
