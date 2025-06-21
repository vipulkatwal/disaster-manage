// Step 4: Gemini Integration Helper Functions
import { getFromCache, setCache } from "./cache"

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

async function callGeminiAPI(prompt: string): Promise<string> {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })
    const data = await response.json()
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    return result
  } catch (error) {
    console.error("Gemini API error:", error)
    return ""
  }
}

// Gemini API calls should only be made from the backend for security and correct model usage.
// Do NOT use this file for direct Gemini API calls in the frontend. Use backend API endpoints instead.

export async function extractLocationFromText(text: string): Promise<string> {
  const prompt = `What is the location mentioned in this text? Respond with only the location name, or "Unknown Location" if none.\n\nText: "${text}"`
  const result = await callGeminiAPI(prompt)
  return result.trim() || "Unknown Location"
}

export async function verifyImageAuthenticity(_imageUrl: string): Promise<{
  isAuthentic: boolean
  confidence: number
  reasoning: string
}> {
  throw new Error("verifyImageAuthenticity should be called via backend API, not directly from the frontend.")
}

export async function classifyUrgency(_text: string): Promise<{
  urgency: "low" | "medium" | "high" | "critical"
  keywords: string[]
  reasoning: string
}> {
  throw new Error("classifyUrgency should be called via backend API, not directly from the frontend.")
}
