// Step 3: Cache Utility Module
import { supabase } from "./supabase"

export async function getFromCache(key: string): Promise<any | null> {
  try {
    const { data, error } = await supabase.from("cache").select("value, expires_at").eq("key", key).single()

    if (error || !data) return null

    // Check if cache has expired
    if (new Date(data.expires_at) < new Date()) {
      // Clean up expired cache
      await supabase.from("cache").delete().eq("key", key)
      return null
    }

    return data.value
  } catch (error) {
    console.error("Cache get error:", error)
    return null
  }
}

export async function setCache(key: string, value: any, ttlHours = 1): Promise<void> {
  try {
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + ttlHours)

    await supabase.from("cache").upsert({
      key,
      value,
      expires_at: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error("Cache set error:", error)
  }
}

export async function clearExpiredCache(): Promise<void> {
  try {
    await supabase.from("cache").delete().lt("expires_at", new Date().toISOString())
  } catch (error) {
    console.error("Cache cleanup error:", error)
  }
}
