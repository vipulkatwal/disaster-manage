// Step 7: Complete Socket.IO Server Implementation
import { Server } from "socket.io"
import { createServer } from "http"
import express from "express"
import cors from "cors"
import { supabase } from "./services/supabase"

const app = express()
app.use(cors())
app.use(express.json())

const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// Store active connections and their subscriptions
const connections = new Map()
const roomSubscriptions = new Map()

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`)
  connections.set(socket.id, { socket, rooms: new Set() })

  // Join disaster-specific room
  socket.on("join_disaster", (disasterId) => {
    socket.join(`disaster:${disasterId}`)
    const conn = connections.get(socket.id)
    if (conn) {
      conn.rooms.add(`disaster:${disasterId}`)
    }
    console.log(`Client ${socket.id} joined disaster room: ${disasterId}`)
  })

  // Leave disaster room
  socket.on("leave_disaster", (disasterId) => {
    socket.leave(`disaster:${disasterId}`)
    const conn = connections.get(socket.id)
    if (conn) {
      conn.rooms.delete(`disaster:${disasterId}`)
    }
    console.log(`Client ${socket.id} left disaster room: ${disasterId}`)
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
    console.log(`Client ${socket.id} joined location room: ${locationRoom}`)
  })

  // Handle real-time disaster updates
  socket.on("disaster_update", (data) => {
    // Broadcast to disaster-specific room
    socket.to(`disaster:${data.id}`).emit("disaster_updated", data)

    // Broadcast to location-based rooms if coordinates available
    if (data.coordinates) {
      broadcastToNearbyClients("disaster_updated", data, data.coordinates)
    }

    // Broadcast to global room
    socket.broadcast.emit("disaster_updated", data)
  })

  // Handle resource updates
  socket.on("resource_update", (data) => {
    socket.to(`disaster:${data.disaster_id}`).emit("resources_updated", data)

    if (data.coordinates) {
      broadcastToNearbyClients("resources_updated", data, data.coordinates)
    }
  })

  // Handle social media updates
  socket.on("social_media_update", (data) => {
    socket.to(`disaster:${data.disaster_id}`).emit("social_media_updated", data)

    // Broadcast urgent social media updates globally
    if (data.urgency === "critical" || data.urgency === "high") {
      socket.broadcast.emit("social_media_updated", data)
    }
  })

  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    socket.emit("heartbeat", { timestamp: new Date().toISOString() })
  }, 30000)

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`)
    clearInterval(heartbeat)
    connections.delete(socket.id)
  })
})

// Function to broadcast to clients within geographic radius
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

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

// Database change listeners using Supabase real-time
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

const PORT = process.env.SOCKET_PORT || 3001
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
})

export { io }
