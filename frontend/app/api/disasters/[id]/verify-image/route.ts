import { type NextRequest, NextResponse } from "next/server"
import { verifyImageAuthenticity } from "@/lib/gemini"
import { supabase } from "@/lib/supabase"
import { getCurrentUser, logAuditTrail } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser()
    const body = await request.json()
    const { imageUrl } = body

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL required" }, { status: 400 })
    }

    // Verify image authenticity using Gemini
    const verification = await verifyImageAuthenticity(imageUrl)

    // Update disaster verification status if needed
    const verificationStatus =
      verification.isAuthentic && verification.confidence > 70
        ? "verified"
        : verification.confidence < 30
          ? "suspicious"
          : "pending"

    await supabase
      .from("disasters")
      .update({
        verification_status: verificationStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    await logAuditTrail("disaster", params.id, "image_verified", user.id, {
      imageUrl,
      verification,
      status: verificationStatus,
    })

    return NextResponse.json({
      ...verification,
      status: verificationStatus,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
