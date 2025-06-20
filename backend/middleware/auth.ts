// Authentication middleware for server routes
import type { Request, Response, NextFunction } from "express"
import { getCurrentUser, hasPermission } from "../services/auth"

export interface AuthenticatedRequest extends Request {
  user?: any
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = getCurrentUser()
    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ error: "Authentication required" })
  }
}

export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user || getCurrentUser()

      if (!hasPermission(user, permission)) {
        return res.status(403).json({ error: "Insufficient permissions" })
      }

      next()
    } catch (error) {
      res.status(401).json({ error: "Authentication required" })
    }
  }
}

export function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user || getCurrentUser()

      if (user.role !== role) {
        return res.status(403).json({ error: `${role} role required` })
      }

      next()
    } catch (error) {
      res.status(401).json({ error: "Authentication required" })
    }
  }
}
