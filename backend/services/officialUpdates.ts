import axios from "axios"
import * as cheerio from "cheerio"
import { getFromCache, setCache } from "./cache"
import { supabase } from "./supabase"

interface UpdateItem {
  title: string
  url: string | undefined
  source: string
}

const SOURCES = [
  {
    name: "FEMA",
    url: "https://www.fema.gov/disaster/current",
    selector: ".views-row .field-content a",
  },
  {
    name: "Red Cross",
    url: "https://www.redcross.org/about-us/news-and-events/latest-news.html",
    selector: ".listing__title a",
  },
]

export async function getOfficialUpdates(disasterId: string): Promise<UpdateItem[]> {
  const cacheKey = `official_updates_${disasterId}`
  const cached = await getFromCache(cacheKey)
  if (cached) return cached

  const updates: UpdateItem[] = []
  for (const source of SOURCES) {
    try {
      const { data } = await axios.get(source.url)
      const $ = cheerio.load(data)
      const items: UpdateItem[] = $(source.selector).slice(0, 5).map((_: any, el: any) => ({
        title: $(el).text().trim(),
        url: $(el).attr("href"),
        source: source.name,
      })).get()
      updates.push(...items)
    } catch (e) {
      // Log and skip
      console.error(`Failed to fetch from ${source.name}:`, e)
    }
  }
  await setCache(cacheKey, updates, 60 * 60) // 1 hour TTL
  return updates
}