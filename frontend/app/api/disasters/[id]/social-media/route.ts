import { NextRequest, NextResponse } from "next/server"
import { searchBlueskyPosts } from "@/lib/bluesky"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Use the disaster id as the search keyword, or default to 'disaster'
    const keyword = params.id || "disaster"
    const posts = await searchBlueskyPosts(keyword)
    return NextResponse.json(posts)
  } catch (error) {
    console.error("Social media API error:", error)
    return NextResponse.json({ error: "Failed to fetch social media" }, { status: 500 })
  }
}
