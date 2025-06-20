"use client"

import React from "react"
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api"

const containerStyle = {
  width: "100%",
  height: "350px",
}

export default function ResourcesMapView({ resources }: { resources: any[] }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  })

  // Center on the first resource or a default location
  const center = resources.length
    ? {
        lat: resources[0].location?.coordinates[1] || 40.7128,
        lng: resources[0].location?.coordinates[0] || -74.006,
      }
    : { lat: 40.7128, lng: -74.006 }

  if (!isLoaded) return <div>Loading map...</div>

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>
      {resources.map((resource) =>
        resource.location ? (
          <Marker
            key={resource.id}
            position={{
              lat: resource.location.coordinates[1],
              lng: resource.location.coordinates[0],
            }}
            title={resource.name}
          />
        ) : null
      )}
    </GoogleMap>
  )
}