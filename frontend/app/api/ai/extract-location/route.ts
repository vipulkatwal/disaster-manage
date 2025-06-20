import { NextRequest, NextResponse } from "next/server"
import { extractLocationFromText } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  const { text } = await request.json()
  if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 })
  const location = await extractLocationFromText(text)
  return NextResponse.json({ location })
}