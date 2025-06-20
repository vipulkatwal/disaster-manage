import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getCurrentUser, logAuditTrail } from "@/lib/auth"
import { convertLocationToLatLng } from "@/backend/services/geocoding"
import { extractLocationFromText, classifyUrgency } from "@/lib/gemini"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("disaster_id", params.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser()
    const body = await request.json()
    const { content, image_url, location_name } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
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
      disaster_id: params.id,
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
      disaster_id: params.id,
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
