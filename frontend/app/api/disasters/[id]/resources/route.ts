import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const dummyResources = [
  {
    id: "demo-resource-1",
    disaster_id: "demo-disaster-id",
    name: "Demo Shelter",
    type: "shelter",
    location_name: "123 Demo St, Demo City",
    status: "available",
    capacity: 100,
    current_occupancy: 42,
    contact: "(555) 123-4567",
    hours: "24/7",
    services: ["Emergency Housing", "Hot Meals"],
    location: { type: "Point", coordinates: [-74.006, 40.7128] },
  },
  {
    id: "demo-resource-2",
    disaster_id: "demo-disaster-id",
    name: "Demo Medical Center",
    type: "medical",
    location_name: "456 Health Ave, Demo City",
    status: "available",
    capacity: 50,
    current_occupancy: 10,
    contact: "(555) 987-6543",
    hours: "8am-8pm",
    services: ["Emergency Care", "Pharmacy"],
    location: { type: "Point", coordinates: [-74.01, 40.715] },
  },
  {
    id: "demo-resource-3",
    disaster_id: "demo-disaster-id",
    name: "Demo Food Bank",
    type: "food",
    location_name: "789 Food Rd, Demo City",
    status: "available",
    capacity: 300,
    current_occupancy: 120,
    contact: "(555) 222-3333",
    hours: "10am-6pm",
    services: ["Food Distribution", "Water Bottles"],
    location: { type: "Point", coordinates: [-74.012, 40.713] },
  },
  {
    id: "demo-resource-4",
    disaster_id: "demo-disaster-id",
    name: "Demo Supply Depot",
    type: "supplies",
    location_name: "321 Supply Ave, Demo City",
    status: "available",
    capacity: 500,
    current_occupancy: 200,
    contact: "(555) 444-5555",
    hours: "9am-9pm",
    services: ["Blankets", "Clothing", "Hygiene Kits"],
    location: { type: "Point", coordinates: [-74.008, 40.718] },
  },
  {
    id: "demo-resource-5",
    disaster_id: "demo-disaster-id",
    name: "Demo Evacuation Point",
    type: "evacuation",
    location_name: "654 Evac Rd, Demo City",
    status: "available",
    capacity: 1000,
    current_occupancy: 300,
    contact: "(555) 666-7777",
    hours: "24/7",
    services: ["Bus Pickup", "Safe Zone"],
    location: { type: "Point", coordinates: [-74.015, 40.719] },
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
