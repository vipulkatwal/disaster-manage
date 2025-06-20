// Step 12: Socket.IO Client Integration
import { io, type Socket } from "socket.io-client"

class SocketManager {
  private socket: Socket | null = null
  private listeners: Map<string, Function[]> = new Map()

  connect() {
    if (this.socket?.connected) return

    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
      transports: ["websocket"],
    })

    this.socket.on("connect", () => {
      console.log("Connected to real-time server")
    })

    this.socket.on("disconnect", () => {
      console.log("Disconnected from real-time server")
    })

    // Set up event listeners
    this.socket.on("disaster_updated", (data) => {
      this.emit("disaster_updated", data)
    })

    this.socket.on("social_media_updated", (data) => {
      this.emit("social_media_updated", data)
    })

    this.socket.on("resources_updated", (data) => {
      this.emit("resources_updated", data)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      const index = eventListeners.indexOf(callback)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data))
    }
  }

  joinDisasterRoom(disasterId: string) {
    if (this.socket) {
      this.socket.emit("join_disaster", disasterId)
    }
  }

  leaveDisasterRoom(disasterId: string) {
    if (this.socket) {
      this.socket.emit("leave_disaster", disasterId)
    }
  }
}

export const socketManager = new SocketManager()

// Auto-connect when imported
if (typeof window !== "undefined") {
  socketManager.connect()
}
