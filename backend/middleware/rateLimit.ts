// Rate limiting middleware
import type { Request, Response, NextFunction } from "express"

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export function createRateLimit(options: { windowMs: number; max: number; message?: string }) {
  const { windowMs, max, message = "Too many requests" } = options

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || "unknown"
    const now = Date.now()

    // Clean up expired entries
    if (store[key] && now > store[key].resetTime) {
      delete store[key]
    }

    // Initialize or increment counter
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      }
    } else {
      store[key].count++
    }

    // Check if limit exceeded
    if (store[key].count > max) {
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
      })
    }

    // Add rate limit headers
    res.set({
      "X-RateLimit-Limit": max.toString(),
      "X-RateLimit-Remaining": Math.max(0, max - store[key].count).toString(),
      "X-RateLimit-Reset": new Date(store[key].resetTime).toISOString(),
    })

    next()
  }
}

// Predefined rate limits
export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
})

export const strictRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: "Too many requests for this endpoint",
})

export const aiRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI requests per minute
  message: "AI service rate limit exceeded",
})
