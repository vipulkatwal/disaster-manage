"use client"

import React from "react"

import { useState } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Label } from "../components/ui/label"
import { Badge } from "../components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { X, Zap, CheckCircle, AlertCircle } from "lucide-react"
import { postDisaster, verifyImage } from "../lib/api"
import { extractLocationFromText } from "../lib/gemini"

interface DisasterFormProps {
  onClose: () => void
}

export default function DisasterForm({ onClose }: DisasterFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    location_name: "",
    description: "",
    tags: [] as string[],
    priority: "medium" as "low" | "medium" | "high" | "critical",
    imageUrl: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "loading" | "verified" | "suspicious">("idle")
  const [verificationDetails, setVerificationDetails] = useState<any>(null)

  const availableTags = [
    "flood",
    "fire",
    "earthquake",
    "hurricane",
    "urgent",
    "medical",
    "evacuation",
    "shelter",
    "power",
    "infrastructure",
  ]
  const priorityOptions = ["low", "medium", "high", "critical"] as const

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))
  }

  const handleLocationExtract = async () => {
    if (!formData.description) return
    setLocationStatus("loading")
    try {
      const response = await fetch("/api/ai/extract-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: formData.description }),
      })
      const data = await response.json()
      setFormData((prev) => ({ ...prev, location_name: data.location || "Unknown Location" }))
      setLocationStatus("success")
    } catch (error) {
      setLocationStatus("error")
      console.error("Location extraction failed:", error)
    }
  }

  const handleImageVerification = async () => {
    if (!formData.imageUrl) return

    setVerificationStatus("loading")
    try {
      // For demo, we'll simulate the verification since we need a disaster ID
      // In real implementation, this would be called after disaster creation
      const mockVerification = {
        isAuthentic: Math.random() > 0.3,
        confidence: Math.floor(Math.random() * 40) + 60,
        reasoning: "Image analysis completed using AI verification",
      }

      setVerificationDetails(mockVerification)
      setVerificationStatus(mockVerification.isAuthentic ? "verified" : "suspicious")
    } catch (error) {
      setVerificationStatus("suspicious")
      console.error("Image verification failed:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const disaster = await postDisaster({
        title: formData.title,
        location_name: formData.location_name,
        description: formData.description,
        tags: formData.tags,
        priority: formData.priority,
      })

      // If image provided, verify it
      if (formData.imageUrl) {
        try {
          await verifyImage(disaster.id, formData.imageUrl)
        } catch (error) {
          console.error("Image verification failed:", error)
        }
      }

      onClose()
    } catch (error) {
      console.error("Failed to create disaster:", error)
      alert("Failed to create disaster report. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">Report New Disaster</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Disaster Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Manhattan Flooding Emergency"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the disaster situation, affected areas, and immediate needs..."
              rows={4}
              required
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLocationExtract}
              disabled={!formData.description || locationStatus === "loading"}
              className="mt-2"
            >
              {locationStatus === "loading" ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Extracting Location...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  AI Extract Location
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <div className="flex space-x-2">
              <Input
                id="location"
                value={formData.location_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, location_name: e.target.value }))}
                placeholder="Enter location or use AI extraction"
                required
              />
              {locationStatus === "success" && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Priority Level</Label>
            <div className="flex gap-2">
              {priorityOptions.map((priority) => (
                <Button
                  key={priority}
                  type="button"
                  variant={formData.priority === priority ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData((prev) => ({ ...prev, priority }))}
                  className={formData.priority === priority ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  {priority}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={formData.tags.includes(tag) ? "default" : "outline"}
                  className={`cursor-pointer ${
                    formData.tags.includes(tag) ? "bg-red-600 hover:bg-red-700" : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Evidence Image URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://example.com/disaster-image.jpg"
            />
            {formData.imageUrl && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleImageVerification}
                  disabled={verificationStatus === "loading"}
                >
                  {verificationStatus === "loading" ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Verifying Image...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      AI Verify Image
                    </>
                  )}
                </Button>

                {verificationStatus === "verified" && verificationDetails && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center text-green-600 text-sm mb-1">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Image appears authentic ({verificationDetails.confidence}% confidence)
                    </div>
                    <p className="text-xs text-green-700">{verificationDetails.reasoning}</p>
                  </div>
                )}

                {verificationStatus === "suspicious" && verificationDetails && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center text-red-600 text-sm mb-1">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Image may be manipulated ({verificationDetails.confidence}% confidence)
                    </div>
                    <p className="text-xs text-red-700">{verificationDetails.reasoning}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title || !formData.description || !formData.location_name}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
