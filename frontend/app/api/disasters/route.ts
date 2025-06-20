// Step 6: Backend REST API Routes
import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getCurrentUser, logAuditTrail } from "@/lib/auth"
import { convertLocationToLatLng } from "@/lib/geocoding"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get("tag")
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")

    let query = supabase.from("disasters").select("*").order("created_at", { ascending: false })

    if (tag) {
      query = query.contains("tags", [tag])
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (priority) {
      query = query.eq("priority", priority)
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
    const body = await request.json()

    const { title, location_name, description, tags, priority = "medium" } = body

    if (!title || !location_name || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get coordinates for location
    const coordinates = await convertLocationToLatLng(location_name)

    const disasterData: any = {
      title,
      location_name,
      description,
      tags: tags || [],
      priority,
      owner_id: user.id,
      status: "active",
      verification_status: "pending",
    }

    if (coordinates) {
      disasterData.location = `POINT(${coordinates.lng} ${coordinates.lat})`
    }

    const { data, error } = await supabase.from("disasters").insert(disasterData).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log audit trail
    await logAuditTrail("disaster", data.id, "created", user.id, { title, location_name })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
