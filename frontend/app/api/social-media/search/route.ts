import { type NextRequest, NextResponse } from "next/server"
import { socialMediaAggregator } from "@/lib/social-media"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keywords, location, detectMisinformation = false } = body

    if (!keywords || !Array.isArray(keywords)) {
      return NextResponse.json({ error: "Keywords array required" }, { status: 400 })
    }

    let posts = await socialMediaAggregator.searchDisasterPosts(keywords, location)

    if (detectMisinformation) {
      const suspiciousPosts = await socialMediaAggregator.detectMisinformation(posts)
      posts = posts.map((post) => {
        const suspicious = suspiciousPosts.find((sp) => sp.id === post.id)
        return suspicious ? suspicious : post
      })
    }

    return NextResponse.json({
      posts,
      metadata: {
        total: posts.length,
        urgent: posts.filter((p) => ["high", "critical"].includes(p.urgency)).length,
        verified: posts.filter((p) => p.verified).length,
        suspicious: posts.filter((p) => p.misinformationFlags?.suspicious).length,
      },
    })
  } catch (error) {
    console.error("Social media search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
