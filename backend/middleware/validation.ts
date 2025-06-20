// Request validation middleware
import type { Request, Response, NextFunction } from "express"
import { body, param, query, validationResult } from "express-validator"

export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    })
  }
  next()
}

// Disaster validation rules
export const validateDisaster = [
  body("title").isLength({ min: 5, max: 255 }).withMessage("Title must be 5-255 characters"),
  body("location_name").isLength({ min: 2, max: 255 }).withMessage("Location name must be 2-255 characters"),
  body("description").isLength({ min: 10, max: 2000 }).withMessage("Description must be 10-2000 characters"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("priority").optional().isIn(["low", "medium", "high", "critical"]).withMessage("Invalid priority level"),
  handleValidationErrors,
]

// Report validation rules
export const validateReport = [
  body("disaster_id").isUUID().withMessage("Valid disaster ID required"),
  body("content").isLength({ min: 10, max: 1000 }).withMessage("Content must be 10-1000 characters"),
  body("image_url").optional().isURL().withMessage("Valid image URL required"),
  body("location_name").optional().isLength({ min: 2, max: 255 }).withMessage("Location name must be 2-255 characters"),
  handleValidationErrors,
]

// Resource validation rules
export const validateResource = [
  body("disaster_id").isUUID().withMessage("Valid disaster ID required"),
  body("name").isLength({ min: 2, max: 255 }).withMessage("Name must be 2-255 characters"),
  body("type").isIn(["shelter", "medical", "food", "supplies", "evacuation"]).withMessage("Invalid resource type"),
  body("location_name").isLength({ min: 2, max: 255 }).withMessage("Location name must be 2-255 characters"),
  body("status").optional().isIn(["available", "full", "closed"]).withMessage("Invalid status"),
  body("capacity").optional().isInt({ min: 0 }).withMessage("Capacity must be a positive integer"),
  body("current_occupancy").optional().isInt({ min: 0 }).withMessage("Current occupancy must be a positive integer"),
  body("contact").optional().isLength({ min: 5, max: 255 }).withMessage("Contact must be 5-255 characters"),
  body("hours").optional().isLength({ min: 2, max: 100 }).withMessage("Hours must be 2-100 characters"),
  body("services").optional().isArray().withMessage("Services must be an array"),
  handleValidationErrors,
]

// Geographic validation rules
export const validateCoordinates = [
  query("lat").optional().isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90"),
  query("lng").optional().isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180"),
  query("radius")
    .optional()
    .isInt({ min: 100, max: 100000 })
    .withMessage("Radius must be between 100 and 100000 meters"),
  handleValidationErrors,
]

// UUID validation
export const validateUUID = [param("id").isUUID().withMessage("Valid UUID required"), handleValidationErrors]
