import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getCurrentUser, logAuditTrail } from "@/lib/auth"
import { convertLocationToLatLng } from "@/lib/geocoding"
import { extractLocationFromText, classifyUrgency } from "@/lib/gemini"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const disasterId = searchParams.get("disaster_id")
    const priority = searchParams.get("priority")
    const status = searchParams.get("status")

    let query = supabase.from("reports").select("*").order("created_at", { ascending: false })

    if (disasterId) {
      query = query.eq("disaster_id", disasterId)
    }

    if (priority) {
      query = query.eq("priority", priority)
    }

    if (status) {
      query = query.eq("verification_status", status)
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
    const { disaster_id, content, image_url, location_name } = body

    if (!disaster_id || !content) {
      return NextResponse.json({ error: "Disaster ID and content are required" }, { status: 400 })
    }

    // Extract location if not provided
    let finalLocationName = location_name
    if (!finalLocationName && content) {
      finalLocationName = await extractLocationFromText(content)
    }

    // Get coordinates
    const coordinates = finalLocationName ? await convertLocationToLatLng(finalLocationName) : null

    // Classify urgency
    const urgencyData = await classifyUrgency(content)

    const reportData: any = {
      disaster_id,
      user_id: user.id,
      content,
      image_url,
      location_name: finalLocationName,
      priority: urgencyData.urgency,
      verification_status: "pending",
    }

    if (coordinates) {
      reportData.location = `POINT(${coordinates.lng} ${coordinates.lat})`
    }

    const { data, error } = await supabase.from("reports").insert(reportData).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logAuditTrail("report", data.id, "created", user.id, {
      disaster_id,
      urgency: urgencyData.urgency,
      keywords: urgencyData.keywords,
    })

    return NextResponse.json(
      {
        ...data,
        urgency_analysis: urgencyData,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Report creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
