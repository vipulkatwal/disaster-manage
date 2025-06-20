import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getCurrentUser, hasPermission, logAuditTrail } from "@/lib/auth"
import { convertLocationToLatLng } from "@/lib/geocoding"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const disasterId = searchParams.get("disaster_id")

    let query = supabase.from("resources").select("*").order("created_at", { ascending: false })

    if (type) {
      query = query.eq("type", type)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (disasterId) {
      query = query.eq("disaster_id", disasterId)
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

export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser()

    if (!hasPermission(user, "manage_resources")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const {
      disaster_id,
      name,
      type,
      location_name,
      status = "available",
      capacity,
      current_occupancy = 0,
      contact,
      hours,
      services = [],
    } = body

    if (!disaster_id || !name || !type || !location_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get coordinates for location
    const coordinates = await convertLocationToLatLng(location_name)

    const resourceData: any = {
      disaster_id,
      name,
      type,
      location_name,
      status,
      capacity,
      current_occupancy,
      contact,
      hours,
      services,
    }

    if (coordinates) {
      resourceData.location = `POINT(${coordinates.lng} ${coordinates.lat})`
    }

    const { data, error } = await supabase.from("resources").insert(resourceData).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logAuditTrail("resource", data.id, "created", user.id, {
      disaster_id,
      name,
      type,
      location_name,
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Resource creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
