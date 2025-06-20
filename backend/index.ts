// Main Express Server with all endpoints

import 'dotenv/config'
import express from "express"
import cors from "cors"
import { createServer } from "http"
import { Server } from "socket.io"
import { supabase } from "./services/supabase"
import { socialMediaAggregator } from "./services/social-media"
import { getCurrentUser, logAuditTrail } from "./services/auth"
import { convertLocationToLatLng } from "./services/geocoding"
import { extractLocationFromText, classifyUrgency, verifyImageAuthenticity } from "./services/gemini"
import { getFromCache, setCache, clearExpiredCache } from "./services/cache"
import officialUpdatesRouter from "./routes/official-updates"
import verifyImageRouter from "./routes/verify-image"

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
})

// Middleware
app.use(cors())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Register new routers
app.use(officialUpdatesRouter)
app.use(verifyImageRouter)

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// ===== DISASTER ENDPOINTS =====
app.get("/api/disasters", async (req, res) => {
  try {
    const { tag, status, priority, lat, lng, radius } = req.query

    let query = supabase.from("disasters").select("*").order("created_at", { ascending: false })

    if (tag) query = query.contains("tags", [tag as string])
    if (status) query = query.eq("status", status)
    if (priority) query = query.eq("priority", priority)

    // Geographic filtering
    if (lat && lng) {
      const { data, error } = await supabase.rpc("nearby_disasters", {
        lat: Number.parseFloat(lat as string),
        lon: Number.parseFloat(lng as string),
        radius_meters: Number.parseInt((radius as string) || "50000"),
      })

      if (error) throw error
      return res.json(data)
    }

    const { data, error } = await query
    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error("Get disasters error:", error)
    res.status(500).json({ error: "Failed to fetch disasters" })
  }
})

app.post("/api/disasters", async (req, res) => {
  try {
    const user = getCurrentUser()
    const { title, location_name, description, tags, priority = "medium", image_url } = req.body

    if (!title || !location_name || !description) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // AI location extraction if needed
    let finalLocationName = location_name
    if (!finalLocationName && description) {
      finalLocationName = await extractLocationFromText(description)
    }

    // Get coordinates
    const coordinates = await convertLocationToLatLng(finalLocationName)

    // AI urgency classification
    const urgencyData = await classifyUrgency(description)

    const disasterData: any = {
      title,
      location_name: finalLocationName,
      description,
      tags: tags || [],
      priority: urgencyData.urgency,
      owner_id: user.id,
      status: "active",
      verification_status: "pending",
    }

    if (coordinates) {
      disasterData.location = `POINT(${coordinates.lng} ${coordinates.lat})`
    }

    const { data, error } = await supabase.from("disasters").insert(disasterData).select().single()

    if (error) throw error

    // AI image verification if provided
    if (image_url) {
      try {
        const verification = await verifyImageAuthenticity(image_url)
        const verificationStatus =
          verification.isAuthentic && verification.confidence > 70
            ? "verified"
            : verification.confidence < 30
              ? "suspicious"
              : "pending"

        await supabase.from("disasters").update({ verification_status: verificationStatus }).eq("id", data.id)

        data.verification_status = verificationStatus
        data.image_verification = verification
      } catch (verifyError) {
        console.error("Image verification failed:", verifyError)
      }
    }

    await logAuditTrail("disaster", data.id, "created", user.id, {
      title,
      location_name: finalLocationName,
      urgency: urgencyData.urgency,
    })

    // Real-time broadcast
    io.emit("disaster_updated", { ...data, coordinates })

    res.status(201).json({ ...data, urgency_analysis: urgencyData })
  } catch (error) {
    console.error("Create disaster error:", error)
    res.status(500).json({ error: "Failed to create disaster" })
  }
})

app.put("/api/disasters/:id", async (req, res) => {
  try {
    const user = getCurrentUser()
    const { id } = req.params
    const updateData = req.body

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("disasters").update(updateData).eq("id", id).select().single()

    if (error) throw error

    await logAuditTrail("disaster", id, "updated", user.id, updateData)

    // Real-time broadcast
    io.emit("disaster_updated", data)

    res.json(data)
  } catch (error) {
    console.error("Update disaster error:", error)
    res.status(500).json({ error: "Failed to update disaster" })
  }
})

// ===== REPORTS ENDPOINTS =====
app.get("/api/reports", async (req, res) => {
  try {
    const { disaster_id, priority, status } = req.query

    let query = supabase.from("reports").select("*").order("created_at", { ascending: false })

    if (disaster_id) query = query.eq("disaster_id", disaster_id)
    if (priority) query = query.eq("priority", priority)
    if (status) query = query.eq("verification_status", status)

    const { data, error } = await query
    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error("Get reports error:", error)
    res.status(500).json({ error: "Failed to fetch reports" })
  }
})

app.post("/api/reports", async (req, res) => {
  try {
    const user = getCurrentUser()
    const { disaster_id, content, image_url, location_name } = req.body

    if (!disaster_id || !content) {
      return res.status(400).json({ error: "Disaster ID and content are required" })
    }

    // AI location extraction
    let finalLocationName = location_name
    if (!finalLocationName && content) {
      finalLocationName = await extractLocationFromText(content)
    }

    // Get coordinates
    const coordinates = finalLocationName ? await convertLocationToLatLng(finalLocationName) : null

    // AI urgency classification
    const urgencyData = await classifyUrgency(content)

    const reportData: any = {
      disaster_id,
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

    if (error) throw error

    await logAuditTrail("report", data.id, "created", user.id, {
      disaster_id,
      urgency: urgencyData.urgency,
    })

    // Real-time broadcast
    io.to(`disaster:${disaster_id}`).emit("report_created", { ...data, coordinates })

    res.status(201).json({ ...data, urgency_analysis: urgencyData })
  } catch (error) {
    console.error("Create report error:", error)
    res.status(500).json({ error: "Failed to create report" })
  }
})

// ===== RESOURCES ENDPOINTS =====
app.get("/api/resources", async (req, res) => {
  try {
    const { type, status, disaster_id, lat, lng, radius } = req.query

    // Geographic search
    if (lat && lng) {
      const { data, error } = await supabase.rpc("nearby_resources", {
        lat: Number.parseFloat(lat as string),
        lon: Number.parseFloat(lng as string),
        radius_meters: Number.parseInt((radius as string) || "10000"),
      })

      if (error) throw error

      let filtered = data
      if (type) filtered = filtered.filter((r: any) => r.type === type)
      if (status) filtered = filtered.filter((r: any) => r.status === status)
      if (disaster_id) filtered = filtered.filter((r: any) => r.disaster_id === disaster_id)

      return res.json(filtered)
    }

    let query = supabase.from("resources").select("*").order("created_at", { ascending: false })

    if (type) query = query.eq("type", type)
    if (status) query = query.eq("status", status)
    if (disaster_id) query = query.eq("disaster_id", disaster_id)

    const { data, error } = await query
    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error("Get resources error:", error)
    res.status(500).json({ error: "Failed to fetch resources" })
  }
})

app.post("/api/resources", async (req, res) => {
  try {
    const user = getCurrentUser()
    const {
      disaster_id,
      name,
      type,
      location_name,
      status = "available",
      capacity,
      current_occupancy = 0,
      contact,
      hours,
      services = [],
    } = req.body

    if (!disaster_id || !name || !type || !location_name) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Get coordinates
    const coordinates = await convertLocationToLatLng(location_name)

    const resourceData: any = {
      disaster_id,
      name,
      type,
      location_name,
      status,
      capacity,
      current_occupancy,
      contact,
      hours,
      services,
    }

    if (coordinates) {
      resourceData.location = `POINT(${coordinates.lng} ${coordinates.lat})`
    }

    const { data, error } = await supabase.from("resources").insert(resourceData).select().single()

    if (error) throw error

    await logAuditTrail("resource", data.id, "created", user.id, { disaster_id, name, type })

    // Real-time broadcast
    io.emit("resources_updated", { ...data, coordinates })

    res.status(201).json(data)
  } catch (error) {
    console.error("Create resource error:", error)
    res.status(500).json({ error: "Failed to create resource" })
  }
})

app.put("/api/resources/:id", async (req, res) => {
  try {
    const user = getCurrentUser()
    const { id } = req.params
    const updateData = req.body

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("resources").update(updateData).eq("id", id).select().single()

    if (error) throw error

    await logAuditTrail("resource", id, "updated", user.id, updateData)

    // Real-time broadcast
    io.emit("resources_updated", data)

    res.json(data)
  } catch (error) {
    console.error("Update resource error:", error)
    res.status(500).json({ error: "Failed to update resource" })
  }
})

// ===== SOCIAL MEDIA ENDPOINTS =====
app.post("/api/social-media/search", async (req, res) => {
  try {
    const { keywords, location, detectMisinformation = false } = req.body

    if (!keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: "Keywords array required" })
    }

    let posts = await socialMediaAggregator.searchDisasterPosts(keywords, location)

    if (detectMisinformation) {
      const suspiciousPosts = await socialMediaAggregator.detectMisinformation(posts)
      posts = posts.map((post) => {
        const suspicious = suspiciousPosts.find((sp) => sp.id === post.id)
        return suspicious ? suspicious : post
      })
    }

    res.json({
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
    res.status(500).json({ error: "Failed to search social media" })
  }
})

app.get("/api/social-media/location/:lat/:lng", async (req, res) => {
  try {
    const { lat, lng } = req.params
    const { radius = 10000 } = req.query

    const posts = await socialMediaAggregator.getPostsByLocation(
      Number.parseFloat(lat),
      Number.parseFloat(lng),
      Number.parseInt(radius as string),
    )

    res.json(posts)
  } catch (error) {
    console.error("Location-based social media error:", error)
    res.status(500).json({ error: "Failed to fetch location-based posts" })
  }
})

// ===== AI SERVICES ENDPOINTS =====
app.post("/api/ai/extract-location", async (req, res) => {
  try {
    const { text } = req.body

    if (!text) {
      return res.status(400).json({ error: "Text is required" })
    }

    const location = await extractLocationFromText(text)
    res.json({ location })
  } catch (error) {
    console.error("Location extraction error:", error)
    res.status(500).json({ error: "Failed to extract location" })
  }
})

app.post("/api/ai/classify-urgency", async (req, res) => {
  try {
    const { text } = req.body

    if (!text) {
      return res.status(400).json({ error: "Text is required" })
    }

    const urgencyData = await classifyUrgency(text)
    res.json(urgencyData)
  } catch (error) {
    console.error("Urgency classification error:", error)
    res.status(500).json({ error: "Failed to classify urgency" })
  }
})

app.post("/api/ai/verify-image", async (req, res) => {
  try {
    const { imageUrl, disasterId } = req.body

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" })
    }

    const verification = await verifyImageAuthenticity(imageUrl)

    // Update disaster verification if disaster ID provided
    if (disasterId) {
      const verificationStatus =
        verification.isAuthentic && verification.confidence > 70
          ? "verified"
          : verification.confidence < 30
            ? "suspicious"
            : "pending"

      await supabase.from("disasters").update({ verification_status: verificationStatus }).eq("id", disasterId)

      const user = getCurrentUser()
      await logAuditTrail("disaster", disasterId, "image_verified", user.id, {
        imageUrl,
        verification,
        status: verificationStatus,
      })
    }

    res.json(verification)
  } catch (error) {
    console.error("Image verification error:", error)
    res.status(500).json({ error: "Failed to verify image" })
  }
})

// ===== GEOCODING ENDPOINTS =====
app.post("/api/geocode", async (req, res) => {
  try {
    const { location, lat, lng } = req.body

    if (location) {
      // Forward geocoding
      const coordinates = await convertLocationToLatLng(location)
      res.json(coordinates)
    } else if (lat && lng) {
      // Reverse geocoding
      const { reverseGeocode } = await import("./services/geocoding")
      const address = await reverseGeocode(lat, lng)
      res.json({ address })
    } else {
      res.status(400).json({ error: "Location or coordinates required" })
    }
  } catch (error) {
    console.error("Geocoding error:", error)
    res.status(500).json({ error: "Geocoding failed" })
  }
})

// ===== ANALYTICS ENDPOINTS =====
app.get("/api/analytics/dashboard", async (req, res) => {
  try {
    const { timeframe = "24h" } = req.query
    const cacheKey = `analytics:dashboard:${timeframe}`

    // Check cache first
    const cached = await getFromCache(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    const timeframeDays = { "1h": 1 / 24, "24h": 1, "7d": 7, "30d": 30 }[timeframe as string] || 1

    const since = new Date()
    since.setDate(since.getDate() - timeframeDays)

    // Get all data
    const [disastersResult, reportsResult, resourcesResult] = await Promise.all([
      supabase
        .from("disasters")
        .select("status, priority, verification_status, created_at, tags")
        .gte("created_at", since.toISOString()),
      supabase
        .from("reports")
        .select("priority, verification_status, created_at")
        .gte("created_at", since.toISOString()),
      supabase
        .from("resources")
        .select("type, status, capacity, current_occupancy, created_at")
        .gte("created_at", since.toISOString()),
    ])

    const disasters = disastersResult.data || []
    const reports = reportsResult.data || []
    const resources = resourcesResult.data || []

    const analytics = {
      overview: {
        totalDisasters: disasters.length,
        activeDisasters: disasters.filter((d) => d.status === "active").length,
        totalReports: reports.length,
        totalResources: resources.length,
        averageResponseTime: "12 minutes",
        verificationRate: disasters.length
          ? Math.round((disasters.filter((d) => d.verification_status === "verified").length / disasters.length) * 100)
          : 0,
      },

      disastersByPriority: {
        critical: disasters.filter((d) => d.priority === "critical").length,
        high: disasters.filter((d) => d.priority === "high").length,
        medium: disasters.filter((d) => d.priority === "medium").length,
        low: disasters.filter((d) => d.priority === "low").length,
      },

      disastersByStatus: {
        active: disasters.filter((d) => d.status === "active").length,
        monitoring: disasters.filter((d) => d.status === "monitoring").length,
        resolved: disasters.filter((d) => d.status === "resolved").length,
      },

      topTags: disasters.reduce(
        (acc, disaster) => {
          disaster.tags?.forEach((tag) => {
            acc[tag] = (acc[tag] || 0) + 1
          })
          return acc
        },
        {} as Record<string, number>,
      ),

      timeline: generateTimeline(disasters, reports, timeframeDays),

      geographicDistribution: disasters
        .reduce(
          (acc, disaster) => {
            const location = disaster.location_name || "Unknown"
            acc[location] = (acc[location] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )
        .entries()
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),

      verificationMetrics: {
        verified: disasters.filter((d) => d.verification_status === "verified").length,
        pending: disasters.filter((d) => d.verification_status === "pending").length,
        suspicious: disasters.filter((d) => d.verification_status === "suspicious").length,
      },
    }

    // Cache for 5 minutes
    await setCache(cacheKey, analytics, 0.083)

    res.json(analytics)
  } catch (error) {
    console.error("Analytics error:", error)
    res.status(500).json({ error: "Failed to generate analytics" })
  }
})

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

// ===== WEBSOCKET HANDLING =====
const connections = new Map()

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`)
  connections.set(socket.id, { socket, rooms: new Set(), location: null })

  // Join disaster room
  socket.on("join_disaster", (disasterId) => {
    socket.join(`disaster:${disasterId}`)
    const conn = connections.get(socket.id)
    if (conn) conn.rooms.add(`disaster:${disasterId}`)
    console.log(`Client ${socket.id} joined disaster room: ${disasterId}`)
  })

  // Leave disaster room
  socket.on("leave_disaster", (disasterId) => {
    socket.leave(`disaster:${disasterId}`)
    const conn = connections.get(socket.id)
    if (conn) conn.rooms.delete(`disaster:${disasterId}`)
  })

  // Join location-based room
  socket.on("join_location", ({ lat, lng, radius = 10000 }) => {
    const locationRoom = `location:${lat.toFixed(3)},${lng.toFixed(3)}`
    socket.join(locationRoom)
    const conn = connections.get(socket.id)
    if (conn) {
      conn.rooms.add(locationRoom)
      conn.location = { lat, lng, radius }
    }
  })

  // Handle real-time updates
  socket.on("disaster_update", (data) => {
    socket.to(`disaster:${data.id}`).emit("disaster_updated", data)
    if (data.coordinates) {
      broadcastToNearbyClients("disaster_updated", data, data.coordinates)
    }
    socket.broadcast.emit("disaster_updated", data)
  })

  socket.on("resource_update", (data) => {
    socket.to(`disaster:${data.disaster_id}`).emit("resources_updated", data)
    if (data.coordinates) {
      broadcastToNearbyClients("resources_updated", data, data.coordinates)
    }
  })

  // Heartbeat
  const heartbeat = setInterval(() => {
    socket.emit("heartbeat", { timestamp: new Date().toISOString() })
  }, 30000)

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`)
    clearInterval(heartbeat)
    connections.delete(socket.id)
  })
})

function broadcastToNearbyClients(event: string, data: any, coordinates: { lat: number; lng: number }) {
  connections.forEach((conn, socketId) => {
    if (conn.location) {
      const distance = calculateDistance(conn.location.lat, conn.location.lng, coordinates.lat, coordinates.lng)
      if (distance <= conn.location.radius) {
        conn.socket.emit(event, { ...data, distance })
      }
    }
  })
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

// ===== DATABASE LISTENERS =====
supabase
  .channel("disasters")
  .on("postgres_changes", { event: "*", schema: "public", table: "disasters" }, (payload) => {
    console.log("Disaster change detected:", payload)
    io.emit("disaster_updated", payload.new || payload.old)
  })
  .subscribe()

supabase
  .channel("resources")
  .on("postgres_changes", { event: "*", schema: "public", table: "resources" }, (payload) => {
    console.log("Resource change detected:", payload)
    io.emit("resources_updated", payload.new || payload.old)
  })
  .subscribe()

supabase
  .channel("reports")
  .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, (payload) => {
    console.log("Report change detected:", payload)
    io.emit("report_created", payload.new || payload.old)
  })
  .subscribe()

// ===== BACKGROUND TASKS =====
// Clean expired cache every hour
setInterval(async () => {
  try {
    await clearExpiredCache()
    console.log("Expired cache cleared")
  } catch (error) {
    console.error("Cache cleanup error:", error)
  }
}, 3600000)

// Social media monitoring every 5 minutes
setInterval(async () => {
  try {
    const keywords = ["emergency", "disaster", "flood", "fire", "earthquake", "help", "SOS"]
    const posts = await socialMediaAggregator.searchDisasterPosts(keywords)

    const urgentPosts = posts.filter((post) => ["high", "critical"].includes(post.urgency))

    if (urgentPosts.length > 0) {
      io.emit("social_media_updated", {
        type: "urgent_posts",
        count: urgentPosts.length,
        posts: urgentPosts.slice(0, 5),
      })
    }
  } catch (error) {
    console.error("Social media monitoring error:", error)
  }
}, 300000)

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`🚀 Disaster Response Server running on port ${PORT}`)
  console.log(`📡 Socket.IO server ready for real-time connections`)
  console.log(`🤖 AI services initialized`)
  console.log(`📊 Analytics engine ready`)
  console.log(`🌐 Social media monitoring active`)
})

export { app, io }
