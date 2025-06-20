// Step 9: Social Media Integration Module
import { getFromCache, setCache } from "./cache"
import { classifyUrgency } from "./gemini"

interface TwitterPost {
  id: string
  text: string
  author: {
    username: string
    verified: boolean
  }
  created_at: string
  public_metrics: {
    retweet_count: number
    like_count: number
    reply_count: number
  }
  geo?: {
    coordinates: [number, number]
    place_name: string
  }
  entities?: {
    hashtags: Array<{ tag: string }>
  }
}

interface BlueskyPost {
  uri: string
  cid: string
  author: {
    handle: string
    displayName?: string
  }
  record: {
    text: string
    createdAt: string
  }
  replyCount: number
  repostCount: number
  likeCount: number
}

export class SocialMediaAggregator {
  private twitterBearerToken: string
  private blueskySession: any

  constructor() {
    this.twitterBearerToken = process.env.TWITTER_BEARER_TOKEN || ""
  }

  async searchDisasterPosts(keywords: string[], location?: { lat: number; lng: number; radius: string }) {
    const cacheKey = `social:${keywords.join(",")}:${location ? `${location.lat},${location.lng}` : "global"}`

    // Check cache first
    const cached = await getFromCache(cacheKey)
    if (cached) return cached

    const results = await Promise.allSettled([
      this.searchTwitter(keywords, location),
      this.searchBluesky(keywords),
      this.searchFacebook(keywords, location),
    ])

    const allPosts = results
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => (result as PromiseFulfilledResult<any>).value)

    // Classify urgency for each post
    const postsWithUrgency = await Promise.all(
      allPosts.map(async (post) => {
        const urgencyData = await classifyUrgency(post.content)
        return {
          ...post,
          urgency: urgencyData.urgency,
          urgencyKeywords: urgencyData.keywords,
          urgencyReasoning: urgencyData.reasoning,
        }
      }),
    )

    // Sort by urgency and engagement
    const sortedPosts = postsWithUrgency.sort((a, b) => {
      const urgencyWeight = { critical: 4, high: 3, medium: 2, low: 1 }
      const aScore = urgencyWeight[a.urgency] * 1000 + a.engagement.total
      const bScore = urgencyWeight[b.urgency] * 1000 + b.engagement.total
      return bScore - aScore
    })

    // Cache for 5 minutes
    await setCache(cacheKey, sortedPosts, 0.083)
    return sortedPosts
  }

  private async searchTwitter(keywords: string[], location?: { lat: number; lng: number; radius: string }) {
    if (!this.twitterBearerToken) return []

    try {
      const query = keywords.map((k) => `"${k}"`).join(" OR ")
      const geoQuery = location ? `&geocode=${location.lat},${location.lng},${location.radius}` : ""

      const response = await fetch(
        `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=50&expansions=author_id,geo.place_id&tweet.fields=created_at,public_metrics,geo&user.fields=verified${geoQuery}`,
        {
          headers: {
            Authorization: `Bearer ${this.twitterBearerToken}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        console.error("Twitter API error:", response.status)
        return []
      }

      const data = await response.json()

      return (data.data || []).map((tweet: any) => ({
        id: tweet.id,
        platform: "twitter",
        author: data.includes?.users?.find((u: any) => u.id === tweet.author_id)?.username || "unknown",
        content: tweet.text,
        timestamp: tweet.created_at,
        engagement: {
          likes: tweet.public_metrics?.like_count || 0,
          shares: tweet.public_metrics?.retweet_count || 0,
          comments: tweet.public_metrics?.reply_count || 0,
          total:
            (tweet.public_metrics?.like_count || 0) +
            (tweet.public_metrics?.retweet_count || 0) +
            (tweet.public_metrics?.reply_count || 0),
        },
        verified: data.includes?.users?.find((u: any) => u.id === tweet.author_id)?.verified || false,
        location: tweet.geo?.place_id ? "Location available" : undefined,
        hashtags: tweet.entities?.hashtags?.map((h: any) => h.tag) || [],
      }))
    } catch (error) {
      console.error("Twitter search error:", error)
      return []
    }
  }

  private async searchBluesky(keywords: string[]) {
    try {
      // Bluesky AT Protocol search
      const query = keywords.join(" ")
      const response = await fetch(
        `https://bsky.social/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(query)}&limit=25`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      )

      if (!response.ok) return []

      const data = await response.json()

      return (data.posts || []).map((post: any) => ({
        id: post.cid,
        platform: "bluesky",
        author: post.author.handle,
        content: post.record.text,
        timestamp: post.record.createdAt,
        engagement: {
          likes: post.likeCount || 0,
          shares: post.repostCount || 0,
          comments: post.replyCount || 0,
          total: (post.likeCount || 0) + (post.repostCount || 0) + (post.replyCount || 0),
        },
        verified: false, // Bluesky doesn't have traditional verification
        hashtags: this.extractHashtags(post.record.text),
      }))
    } catch (error) {
      console.error("Bluesky search error:", error)
      return []
    }
  }

  private async searchFacebook(keywords: string[], location?: { lat: number; lng: number; radius: string }) {
    // Facebook Graph API search (requires app approval for public content)
    // For demo purposes, return mock data
    return [
      {
        id: "fb_mock_1",
        platform: "facebook",
        author: "NYC Emergency Management",
        content: `Emergency alert: ${keywords[0]} situation developing. Please follow official guidance.`,
        timestamp: new Date().toISOString(),
        engagement: {
          likes: 245,
          shares: 89,
          comments: 34,
          total: 368,
        },
        verified: true,
        hashtags: keywords,
      },
    ]
  }

  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#[\w]+/g
    const matches = text.match(hashtagRegex)
    return matches ? matches.map((tag) => tag.slice(1)) : []
  }

  async getPostsByLocation(lat: number, lng: number, radius = 10000) {
    // Search for disaster-related keywords in the area
    const disasterKeywords = [
      "emergency",
      "disaster",
      "flood",
      "fire",
      "earthquake",
      "hurricane",
      "help",
      "SOS",
      "evacuation",
      "shelter",
    ]

    return this.searchDisasterPosts(disasterKeywords, {
      lat,
      lng,
      radius: `${radius}m`,
    })
  }

  async detectMisinformation(posts: any[]) {
    // Use Gemini to detect potential misinformation
    const suspiciousPosts = []

    for (const post of posts) {
      try {
        const prompt = `Analyze this social media post for potential misinformation in disaster context. Look for: 1) Unverified claims 2) Sensational language 3) Lack of credible sources 4) Contradictory information. Respond with JSON: {"suspicious": boolean, "confidence": 0-100, "reasons": ["reason1", "reason2"]}

Post: "${post.content}"
Author verified: ${post.verified}
Engagement: ${post.engagement.total}`

        // This would call Gemini API - simplified for demo
        const isSuspicious = post.content.includes("BREAKING") && !post.verified && post.engagement.total < 10

        if (isSuspicious) {
          suspiciousPosts.push({
            ...post,
            misinformationFlags: {
              suspicious: true,
              confidence: 75,
              reasons: ["Unverified account with sensational claims", "Low engagement for breaking news"],
            },
          })
        }
      } catch (error) {
        console.error("Misinformation detection error:", error)
      }
    }

    return suspiciousPosts
  }
}

export const socialMediaAggregator = new SocialMediaAggregator()
