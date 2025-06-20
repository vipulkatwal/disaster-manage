// Step 13: Analytics and Reporting
import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getFromCache, setCache } from "@/lib/cache"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "24h"
    const cacheKey = `analytics:dashboard:${timeframe}`

    // Check cache first
    const cached = await getFromCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const timeframeDays =
      {
        "1h": 1 / 24,
        "24h": 1,
        "7d": 7,
        "30d": 30,
      }[timeframe] || 1

    const since = new Date()
    since.setDate(since.getDate() - timeframeDays)

    // Get disaster statistics
    const { data: disasters } = await supabase
      .from("disasters")
      .select("status, priority, verification_status, created_at, tags")
      .gte("created_at", since.toISOString())

    // Get reports statistics
    const { data: reports } = await supabase
      .from("reports")
      .select("priority, verification_status, created_at")
      .gte("created_at", since.toISOString())

    // Get resources statistics
    const { data: resources } = await supabase
      .from("resources")
      .select("type, status, capacity, current_occupancy, created_at")
      .gte("created_at", since.toISOString())

    // Calculate metrics
    const analytics = {
      overview: {
        totalDisasters: disasters?.length || 0,
        activeDisasters: disasters?.filter((d) => d.status === "active").length || 0,
        totalReports: reports?.length || 0,
        totalResources: resources?.length || 0,
        averageResponseTime: "12 minutes", // Would calculate from actual data
        verificationRate: disasters?.length
          ? Math.round((disasters.filter((d) => d.verification_status === "verified").length / disasters.length) * 100)
          : 0,
      },

      disastersByPriority: {
        critical: disasters?.filter((d) => d.priority === "critical").length || 0,
        high: disasters?.filter((d) => d.priority === "high").length || 0,
        medium: disasters?.filter((d) => d.priority === "medium").length || 0,
        low: disasters?.filter((d) => d.priority === "low").length || 0,
      },

      disastersByStatus: {
        active: disasters?.filter((d) => d.status === "active").length || 0,
        monitoring: disasters?.filter((d) => d.status === "monitoring").length || 0,
        resolved: disasters?.filter((d) => d.status === "resolved").length || 0,
      },

      resourceUtilization: resources?.reduce(
        (acc, resource) => {
          if (resource.capacity && resource.current_occupancy) {
            const utilization = (resource.current_occupancy / resource.capacity) * 100
            acc[resource.type] = (acc[resource.type] || []).concat(utilization)
          }
          return acc
        },
        {} as Record<string, number[]>,
      ),

      topTags: disasters?.reduce(
        (acc, disaster) => {
          disaster.tags?.forEach((tag) => {
            acc[tag] = (acc[tag] || 0) + 1
          })
          return acc
        },
        {} as Record<string, number>,
      ),

      timeline: generateTimeline(disasters || [], reports || [], timeframeDays),

      geographicDistribution: await getGeographicDistribution(disasters || []),

      verificationMetrics: {
        verified: disasters?.filter((d) => d.verification_status === "verified").length || 0,
        pending: disasters?.filter((d) => d.verification_status === "pending").length || 0,
        suspicious: disasters?.filter((d) => d.verification_status === "suspicious").length || 0,
      },
    }

    // Cache for 5 minutes
    await setCache(cacheKey, analytics, 0.083)

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateTimeline(disasters: any[], reports: any[], days: number) {
  const timeline = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]

    const dayDisasters = disasters.filter((d) => d.created_at.startsWith(dateStr))

    const dayReports = reports.filter((r) => r.created_at.startsWith(dateStr))

    timeline.push({
      date: dateStr,
      disasters: dayDisasters.length,
      reports: dayReports.length,
      critical: dayDisasters.filter((d) => d.priority === "critical").length,
    })
  }

  return timeline
}

async function getGeographicDistribution(disasters: any[]) {
  // Group by location_name and count
  const distribution = disasters.reduce(
    (acc, disaster) => {
      const location = disaster.location_name || "Unknown"
      acc[location] = (acc[location] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Convert to array and sort by count
  return Object.entries(distribution)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Top 10 locations
}
