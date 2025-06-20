import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getCurrentUser, hasPermission, logAuditTrail } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser()

    if (!hasPermission(user, "update_disaster")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { title, location_name, description, tags, status, priority, verification_status } = body

    const updateData: any = {}
    if (title) updateData.title = title
    if (location_name) updateData.location_name = location_name
    if (description) updateData.description = description
    if (tags) updateData.tags = tags
    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (verification_status) updateData.verification_status = verification_status

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("disasters").update(updateData).eq("id", params.id).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logAuditTrail("disaster", params.id, "updated", user.id, updateData)

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser()

    if (!hasPermission(user, "delete_disaster")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { error } = await supabase.from("disasters").delete().eq("id", params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logAuditTrail("disaster", params.id, "deleted", user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
