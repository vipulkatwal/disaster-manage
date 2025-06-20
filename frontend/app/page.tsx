"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, MapPin, Users, Clock, Plus, Zap } from "lucide-react"
import DisasterForm from "@/components/disaster-form"
import DisasterList from "@/components/disaster-list"
import SocialMediaFeed from "@/components/social-media-feed"
import ResourcesMap from "@/components/resources-map"
import RealtimeUpdates from "@/components/realtime-updates"
import { fetchDisasters } from "@/lib/api"
import { socketManager } from "@/lib/socket"

// Add the missing imports and components
import NotificationSystem from "@/components/notification-system"
import AnalyticsDashboard from "@/components/analytics-dashboard"

export default function DisasterResponseDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [stats, setStats] = useState({
    activeDisasters: 0,
    totalReports: 0,
    resourcesDeployed: 156,
    lastUpdate: "Loading...",
  })
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadStats()

    // Set up real-time stats updates
    const handleStatsUpdate = () => {
      loadStats()
      setStats((prev) => ({ ...prev, lastUpdate: new Date().toLocaleTimeString() }))
    }

    socketManager.on("disaster_updated", handleStatsUpdate)
    socketManager.on("resources_updated", handleStatsUpdate)

    return () => {
      socketManager.off("disaster_updated", handleStatsUpdate)
      socketManager.off("resources_updated", handleStatsUpdate)
    }
  }, [])

  const loadStats = async () => {
    try {
      const disasters = await fetchDisasters()
      const activeCount = disasters.filter((d) => d.status === "active").length

      setStats((prev) => ({
        ...prev,
        activeDisasters: activeCount,
        totalReports: disasters.length,
        lastUpdate: new Date().toLocaleTimeString(),
      }))
    } catch (error) {
      console.error("Failed to load stats:", error)
    }
  }

  const handleDisasterCreated = () => {
    setRefreshKey((prev) => prev + 1)
    loadStats()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Disaster Response Coordination</h1>
              <p className="text-sm text-gray-600">Real-time emergency management platform with AI verification</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              System Online
            </Badge>
            {/* Add NotificationSystem to the header section, after the system status badge: */}
            <NotificationSystem />
            <Button onClick={() => setShowCreateForm(true)} className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Report Disaster
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Disasters</p>
                  <p className="text-3xl font-bold text-red-600">{stats.activeDisasters}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reports</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalReports}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resources Deployed</p>
                  <p className="text-3xl font-bold text-green-600">{stats.resourcesDeployed}</p>
                </div>
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Update</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.lastUpdate}</p>
                </div>
                <Clock className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Add Analytics tab to the TabsList: */}
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="disasters">Disasters</TabsTrigger>
            <TabsTrigger value="social">Social Feed</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                    Real-time Updates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RealtimeUpdates />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Disasters</CardTitle>
                </CardHeader>
                <CardContent>
                  <DisasterList limit={5} onRefresh={() => setRefreshKey((prev) => prev + 1)} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="disasters">
            <Card>
              <CardHeader>
                <CardTitle>Disaster Management</CardTitle>
              </CardHeader>
              <CardContent>
                <DisasterList key={refreshKey} onRefresh={() => setRefreshKey((prev) => prev + 1)} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <SocialMediaFeed />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources">
            <Card>
              <CardHeader>
                <CardTitle>Resource Deployment Map</CardTitle>
              </CardHeader>
              <CardContent>
                <ResourcesMap />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Analytics TabsContent after the resources tab: */}
          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Disaster Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <DisasterForm onClose={() => setShowCreateForm(false)} onSuccess={handleDisasterCreated} />
          </div>
        </div>
      )}
    </div>
  )
}
