import { Server } from "socket.io"

// Server-side socket manager
class ServerSocketManager {
  private io: Server | null = null

  setIO(io: Server) {
    this.io = io
  }

  emit(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data)
    }
  }

  emitToUser(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data)
    }
  }

  emitToRoom(room: string, event: string, data: any) {
    if (this.io) {
      this.io.to(room).emit(event, data)
    }
  }
}

export const serverSocketManager = new ServerSocketManager()
