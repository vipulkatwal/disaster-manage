"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Heart, MessageCircle, Repeat2, ExternalLink, AlertTriangle } from "lucide-react"
import { getSocialMedia, type SocialPost } from "../lib/api"
import { socketManager } from "../lib/socket"

// Debounce hook for search/filter operations
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function SocialMediaFeed() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [filter, setFilter] = useState<"all" | "urgent" | "verified">("all")
  const [loading, setLoading] = useState(true)

  // Memoize the social media update handler
  const handleSocialUpdate = useCallback((data: any) => {
    setPosts((prev) => [data, ...prev.slice(0, 19)]) // Keep 20 most recent
  }, [])

  useEffect(() => {
    loadSocialMedia()

    // Set up real-time updates
    socketManager.on("social_media_updated", handleSocialUpdate)

    return () => {
      socketManager.off("social_media_updated", handleSocialUpdate)
    }
  }, [handleSocialUpdate])

  const loadSocialMedia = useCallback(async () => {
    try {
      setLoading(true)
      // For demo, we'll use a mock disaster ID
      const mockDisasterId = "demo-disaster-id"
      const data = await getSocialMedia(mockDisasterId)
      setPosts(data)
    } catch (error) {
      console.error("Failed to load social media:", error)
      // Fallback to mock data
      setPosts([
        {
          id: "1",
          platform: "twitter",
          author: "@NYCEmergency",
          content:
            "🚨 URGENT: Flooding reported in Lower Manhattan. Avoid subway stations on lines 4, 5, 6. Emergency services responding. #NYCFlood #Emergency",
          timestamp: new Date().toISOString(),
          engagement: { likes: 1247, shares: 892, comments: 156 },
          urgency: "critical",
          verified: true,
          location: "Manhattan, NYC",
          hashtags: ["NYCFlood", "Emergency"],
        },
        {
          id: "2",
          platform: "bluesky",
          author: "citizen_reporter.bsky.social",
          content:
            "Water rising fast on Houston Street. Cars abandoned. People helping each other to higher ground. This is serious. #ManhattanFlood",
          timestamp: new Date(Date.now() - 900000).toISOString(),
          engagement: { likes: 234, shares: 89, comments: 45 },
          urgency: "high",
          verified: false,
          location: "Houston Street, NYC",
          hashtags: ["ManhattanFlood"],
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [])

  // Memoize filtered posts to prevent unnecessary re-computations
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (filter === "urgent") return ["high", "critical"].includes(post.urgency)
      if (filter === "verified") return post.verified
      return true
    })
  }, [posts, filter])

  // Memoize utility functions
  const getPlatformColor = useCallback((platform: string) => {
    switch (platform) {
      case "twitter":
        return "bg-blue-500"
      case "bluesky":
        return "bg-sky-500"
      case "facebook":
        return "bg-blue-600"
      default:
        return "bg-gray-500"
    }
  }, [])

  const getUrgencyColor = useCallback((urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-red-600 text-white"
      case "high":
        return "bg-orange-600 text-white"
      case "medium":
        return "bg-yellow-600 text-white"
      case "low":
        return "bg-green-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }, [])

  // Memoize filter buttons to prevent re-renders
  const filterButtons = useMemo(() => [
    {
      key: "all",
      label: "All Posts",
      variant: filter === "all" ? "default" : "outline",
      onClick: () => setFilter("all"),
    },
    {
      key: "urgent",
      label: "Urgent",
      variant: filter === "urgent" ? "default" : "outline",
      onClick: () => setFilter("urgent"),
      className: "text-red-600 border-red-600 hover:bg-red-50",
      icon: AlertTriangle,
    },
    {
      key: "verified",
      label: "Verified Only",
      variant: filter === "verified" ? "default" : "outline",
      onClick: () => setFilter("verified"),
    },
  ], [filter])

  if (loading) {
    return <div className="text-center py-8">Loading social media feed...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {filterButtons.map((button) => (
          <Button
            key={button.key}
            variant={button.variant as any}
            size="sm"
            onClick={button.onClick}
            className={button.className}
          >
            {button.icon && <button.icon className="h-4 w-4 mr-1" />}
            {button.label}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getPlatformColor(post.platform)}`}></div>
                  <span className="font-medium">{post.author}</span>
                  {post.verified && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                      ✓ Verified
                    </Badge>
                  )}
                  <Badge className={`${getUrgencyColor(post.urgency)} text-xs`}>{post.urgency}</Badge>
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-gray-800 mb-3 leading-relaxed">{post.content}</p>

              {post.location && <p className="text-sm text-gray-600 mb-2">📍 {post.location}</p>}

              {post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {post.hashtags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {post.engagement.likes}
                  </div>
                  <div className="flex items-center gap-1">
                    <Repeat2 className="h-4 w-4" />
                    {post.engagement.shares}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {post.engagement.comments}
                  </div>
                </div>
                <span>{new Date(post.timestamp).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
