// Step 4: Gemini Integration Helper Functions
import { getFromCache, setCache } from "./cache"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
// Using Gemini 2.0 Flash model
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

// All Gemini API responses are cached for 1 hour (TTL=1)
async function callGeminiAPI(prompt: string): Promise<string> {
  const cacheKey = `gemini:${Buffer.from(prompt).toString("base64").slice(0, 50)}`

  // Check cache first
  const cached = await getFromCache(cacheKey)
  if (cached) return cached

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    })

    const data = await response.json()
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    // Cache the result for 1 hour
    await setCache(cacheKey, result, 1)
    return result
  } catch (error) {
    console.error("Gemini API error:", error)
    return ""
  }
}

export async function extractLocationFromText(text: string): Promise<string> {
  const prompt = `What is the location mentioned in this text? Respond with only the location name, or "Unknown Location" if none.\n\nText: "${text}"`
  const result = await callGeminiAPI(prompt)
  console.log("Gemini prompt:", prompt)
  console.log("Gemini result:", result)
  return result.trim() || "Unknown Location"
}

export async function verifyImageAuthenticity(imageUrl: string): Promise<{
  isAuthentic: boolean
  confidence: number
  reasoning: string
}> {
  const prompt = `Analyze this image URL for authenticity in the context of disaster reporting. Consider factors like image quality, consistency, potential manipulation signs, and relevance to disaster scenarios. Respond in JSON format with: {\"isAuthentic\": boolean, \"confidence\": 0-100, \"reasoning\": \"brief explanation\"}\n\nImage URL: ${imageUrl}`

  try {
    const result = await callGeminiAPI(prompt)
    const parsed = JSON.parse(result)
    return {
      isAuthentic: parsed.isAuthentic || false,
      confidence: parsed.confidence || 0,
      reasoning: parsed.reasoning || "Unable to verify",
    }
  } catch (error) {
    return {
      isAuthentic: false,
      confidence: 0,
      reasoning: "Error during verification",
    }
  }
}

export async function classifyUrgency(text: string): Promise<{
  urgency: "low" | "medium" | "high" | "critical"
  keywords: string[]
  reasoning: string
}> {
  const prompt = `Analyze this text for urgency level in disaster response context. Look for keywords like \"urgent\", \"help\", \"SOS\", \"emergency\", \"critical\", \"immediate\", etc. Respond in JSON format with: {\"urgency\": \"low|medium|high|critical\", \"keywords\": [\"found\", \"keywords\"], \"reasoning\": \"brief explanation\"}\n\nText: \"${text}\"`

  try {
    const result = await callGeminiAPI(prompt)
    const parsed = JSON.parse(result)
    return {
      urgency: parsed.urgency || "medium",
      keywords: parsed.keywords || [],
      reasoning: parsed.reasoning || "Standard classification",
    }
  } catch (error) {
    return {
      urgency: "medium",
      keywords: [],
      reasoning: "Error during classification",
    }
  }
}

export interface ImageVerificationResult {
  isAuthentic: boolean
  confidence: number
  details: string
}

export async function verifyImage(image_url: string): Promise<ImageVerificationResult> {
  // Replace with actual Gemini API call
  // For now, mock response
  return {
    isAuthentic: Math.random() > 0.2,
    confidence: Math.floor(Math.random() * 100),
    details: "Mocked Gemini image verification result."
  }
}
