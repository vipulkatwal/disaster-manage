// Weather monitoring service
import { alertingService } from "./alerting"
import { getFromCache, setCache } from "./cache"
import { supabase } from "../../frontend/lib/supabaseClient"

interface WeatherAlert {
  id: string
  title: string
  description: string
  severity: "minor" | "moderate" | "severe" | "extreme"
  areas: string[]
  effective: string
  expires: string
}

interface WeatherData {
  location: string
  temperature: number
  humidity: number
  windSpeed: number
  conditions: string
  alerts: WeatherAlert[]
}

class WeatherService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY || ""
  }

  async getWeatherData(lat: number, lng: number): Promise<WeatherData | null> {
    const cacheKey = `weather:${lat.toFixed(3)},${lng.toFixed(3)}`

    // Check cache first (15 minutes)
    const cached = await getFromCache(cacheKey)
    if (cached) return cached

    try {
      // Using OpenWeatherMap API as example
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${this.apiKey}&units=metric`,
      )

      if (!response.ok) {
        console.error("Weather API error:", response.status)
        return null
      }

      const data = await response.json()

      // Get weather alerts
      const alertsResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lng}&appid=${this.apiKey}&exclude=minutely,hourly,daily`,
      )

      let alerts: WeatherAlert[] = []
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json()
        alerts = (alertsData.alerts || []).map((alert: any) => ({
          id: alert.sender_name + alert.start,
          title: alert.event,
          description: alert.description,
          severity: this.mapSeverity(alert.tags),
          areas: alert.areas || [],
          effective: new Date(alert.start * 1000).toISOString(),
          expires: new Date(alert.end * 1000).toISOString(),
        }))
      }

      const weatherData: WeatherData = {
        location: data.name || "Unknown",
        temperature: data.main.temp,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        conditions: data.weather[0].description,
        alerts,
      }

      // Cache for 15 minutes
      await setCache(cacheKey, weatherData, 0.25)

      // Process severe weather alerts
      await this.processWeatherAlerts(alerts, lat, lng)

      return weatherData
    } catch (error) {
      console.error("Weather service error:", error)
      return null
    }
  }

  private mapSeverity(tags: string[]): "minor" | "moderate" | "severe" | "extreme" {
    if (tags.includes("Extreme")) return "extreme"
    if (tags.includes("Severe")) return "severe"
    if (tags.includes("Moderate")) return "moderate"
    return "minor"
  }

  private async processWeatherAlerts(alerts: WeatherAlert[], lat: number, lng: number) {
    for (const alert of alerts) {
      if (["severe", "extreme"].includes(alert.severity)) {
        await alertingService.createAlert({
          type: "weather",
          severity: alert.severity === "extreme" ? "emergency" : "critical",
          title: `Weather Alert: ${alert.title}`,
          message: alert.description,
          location: {
            lat,
            lng,
            radius: 50000, // 50km radius for weather alerts
            name: alert.areas.join(", ") || "Area",
          },
          expires_at: alert.expires,
        })
      }
    }
  }

  async getWeatherForDisaster(disasterId: string): Promise<WeatherData | null> {
    try {
      const { data: disaster } = await supabase
        .from("disasters")
        .select("location, location_name")
        .eq("id", disasterId)
        .single()

      if (!disaster || !disaster.location) return null

      const coordinates = disaster.location.coordinates
      return this.getWeatherData(coordinates[1], coordinates[0])
    } catch (error) {
      console.error("Weather for disaster error:", error)
      return null
    }
  }

  // Monitor weather conditions every 30 minutes
  startWeatherMonitoring() {
    setInterval(async () => {
      try {
        // Get all active disasters with locations
        const { data: disasters } = await supabase
          .from("disasters")
          .select("id, location, location_name")
          .eq("status", "active")
          .not("location", "is", null)

        for (const disaster of disasters || []) {
          const coordinates = disaster.location.coordinates
          await this.getWeatherData(coordinates[1], coordinates[0])
        }
      } catch (error) {
        console.error("Weather monitoring error:", error)
      }
    }, 1800000) // 30 minutes
  }
}

export const weatherService = new WeatherService()

// Start weather monitoring
weatherService.startWeatherMonitoring()
