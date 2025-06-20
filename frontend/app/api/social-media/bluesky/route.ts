import { NextRequest, NextResponse } from "next/server"
import { searchBlueskyPosts } from "@/lib/bluesky"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const keyword = searchParams.get("q") || "disaster"
  const posts = await searchBlueskyPosts(keyword)
  return NextResponse.json(posts)
}