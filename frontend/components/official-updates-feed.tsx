"use client"

import React, { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./ui/card"
import { Badge } from "./ui/badge"
import { ExternalLink } from "lucide-react"

interface Update {
  source: string
  title: string
  description: string
  url: string
  timestamp: string
  type: 'Alert' | 'News' | 'Guidance'
}

const allUpdates: Update[] = [
  {
    source: "FEMA",
    title: "Presidential Major Disaster Declaration for California Wildfires",
    description: "Federal aid has been made available to supplement state, tribal, and local recovery efforts in the areas affected by wildfires beginning on August 15, 2024.",
    url: "#",
    timestamp: "2 hours ago",
    type: 'Alert',
  },
  {
    source: "Red Cross",
    title: "Blood Donations Urgently Needed After Hurricane",
    description: "The American Red Cross is urging eligible donors to give blood to help ensure a sufficient blood supply for patients in areas impacted by the recent hurricane.",
    url: "#",
    timestamp: "5 hours ago",
    type: 'News',
  },
  {
    source: "CDC",
    title: "Guidance for Safe Water After a Flood",
    description: "After a flood, your water may be contaminated. Follow these steps to ensure your water is safe to drink, cook with, and use for hygiene.",
    url: "#",
    timestamp: "1 day ago",
    type: 'Guidance',
  },
  {
    source: "FEMA",
    title: "Disaster Recovery Centers Open in Florida",
    description: "FEMA, in partnership with the state of Florida, has opened several Disaster Recovery Centers (DRCs) to assist residents affected by recent flooding.",
    url: "#",
    timestamp: "1 day ago",
    type: 'News',
  },
  {
    source: "Ready.gov",
    title: "Prepare Your Emergency Supply Kit for Earthquake Season",
    description: "An emergency supply kit is a collection of basic items your household may need in the event of an emergency. Make sure your kit is stocked and ready.",
    url: "#",
    timestamp: "3 days ago",
    type: 'Guidance',
  },
  {
    source: "Red Cross",
    title: "Volunteers Needed for Shelter Operations",
    description: "We are seeking volunteers to help staff emergency shelters, provide meals, and offer comfort to those affected by recent disasters. Training will be provided.",
    url: "#",
    timestamp: "4 days ago",
    type: 'News',
  },
]

const getShuffledUpdates = (count: number) => {
  const shuffled = [...allUpdates].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};


export default function OfficialUpdatesFeed() {
  const [updates, setUpdates] = useState<Update[]>([])

  useEffect(() => {
    setUpdates(getShuffledUpdates(4))
  }, [])

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'fema':
        return 'bg-blue-600 text-white'
      case 'red cross':
        return 'bg-red-600 text-white'
      case 'cdc':
        return 'bg-sky-600 text-white'
      case 'ready.gov':
        return 'bg-gray-700 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  return (
    <div className="space-y-4">
       <h2 className="text-2xl font-bold tracking-tight">Official Updates</h2>
      {updates.map((update, index) => (
        <Card key={index}>
          <CardHeader>
             <div className="flex items-center justify-between">
                <Badge className={getSourceColor(update.source)}>{update.source}</Badge>
                <span className="text-xs text-gray-500">{update.timestamp}</span>
             </div>
            <CardTitle className="pt-2">{update.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>{update.description}</CardDescription>
            <a
              href={update.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:underline mt-4 inline-flex items-center"
            >
              Read More <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}