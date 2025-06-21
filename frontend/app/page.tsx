"use client"

import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { AlertTriangle, MapPin, Users, Clock, Plus, Zap, Home, List, Newspaper, MessageCircle, Map, BarChart3 } from "lucide-react"
import DisasterForm from "../components/disaster-form"
import { fetchDisasters } from "../lib/api"
import { socketManager } from "../lib/socket"
import NotificationSystem from "../components/notification-system"
import gsap from "gsap"
import { Tooltip } from "../components/ui/tooltip"

// Lazy load heavy components
const DisasterList = lazy(() => import("../components/disaster-list"))
const SocialMediaFeed = lazy(() => import("../components/social-media-feed"))
const ResourcesMap = lazy(() => import("../components/resources-map"))
const RealtimeUpdates = lazy(() => import("../components/realtime-updates"))
const AnalyticsDashboard = lazy(() => import("../components/analytics-dashboard"))
const OfficialUpdatesFeed = lazy(() => import("../components/official-updates-feed"))

// Loading component for lazy-loaded components
const TabLoading = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
  </div>
)

export default function DisasterResponseDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [stats, setStats] = useState({
    activeDisasters: 0,
    totalReports: 0,
    resourcesDeployed: 156,
    lastUpdate: "Loading...",
  })
  const statsRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadStats()
    const handleStatsUpdate = () => {
      loadStats()
      setStats((prev) => ({ ...prev, lastUpdate: new Date().toLocaleTimeString() }))
      if (statsRef.current) {
        gsap.fromTo(
          statsRef.current.querySelectorAll(".stat-card"),
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.7, ease: "power3.out" }
        )
      }
    }
    socketManager.on("disaster_updated", handleStatsUpdate)
    socketManager.on("resources_updated", handleStatsUpdate)
    return () => {
      socketManager.off("disaster_updated", handleStatsUpdate)
      socketManager.off("resources_updated", handleStatsUpdate)
    }
  }, [])

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { y: -40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
      )
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
    loadStats()
  }

  // Animated stat counter
  const StatNumber = ({ value, color }: { value: number; color: string }) => {
    const ref = useRef<HTMLSpanElement>(null)
    useEffect(() => {
      if (ref.current) {
        gsap.fromTo(
          ref.current,
          { innerText: 0 },
          {
            innerText: value,
            duration: 1,
            snap: { innerText: 1 },
            ease: "power1.out",
            onUpdate: function () {
              if (ref.current) ref.current.innerText = Math.floor(Number(ref.current.innerText)).toString()
            },
          }
        )
      }
    }, [value])
    return <span ref={ref} className={`text-3xl font-bold ${color}`}>{value}</span>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-pink-50 font-['Poppins','Inter',sans-serif] flex flex-row">
      {/* Modern Sidebar Navigation with Icons and Labels */}
      <aside className="w-60 min-h-screen bg-white/80 backdrop-blur-lg shadow-xl border-r border-gray-100 flex flex-col justify-between py-8 px-4 sticky top-0 z-20">
        <div>
          {/* Logo/Avatar */}
          <div className="mb-10 flex flex-col items-center">
            <div className="bg-gradient-to-br from-pink-500 to-red-500 p-2 rounded-full shadow-lg mb-2">
              <AlertTriangle className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight drop-shadow-lg text-center">Disaster HQ</h2>
          </div>
          {/* Icon + Label Nav */}
          <nav className="flex flex-col gap-2 w-full">
            <SidebarMenuItem icon={<Home className="h-5 w-5 mr-3" />} label="Overview" value="overview" activeTab={activeTab} setActiveTab={setActiveTab} />
            <SidebarMenuItem icon={<List className="h-5 w-5 mr-3" />} label="Disasters" value="disasters" activeTab={activeTab} setActiveTab={setActiveTab} />
            <SidebarMenuItem icon={<Newspaper className="h-5 w-5 mr-3" />} label="Official Updates" value="updates" activeTab={activeTab} setActiveTab={setActiveTab} />
            <SidebarMenuItem icon={<MessageCircle className="h-5 w-5 mr-3" />} label="Social Feed" value="social" activeTab={activeTab} setActiveTab={setActiveTab} />
            <SidebarMenuItem icon={<Map className="h-5 w-5 mr-3" />} label="Resources" value="resources" activeTab={activeTab} setActiveTab={setActiveTab} />
            <SidebarMenuItem icon={<BarChart3 className="h-5 w-5 mr-3" />} label="Analytics" value="analytics" activeTab={activeTab} setActiveTab={setActiveTab} />
          </nav>
        </div>
        {/* User Info at Bottom */}
        <div className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-500">
          <div>Logged in as: <span className="font-semibold text-blue-700">Relief Admin</span></div>
          <div>Role: <span className="font-semibold text-blue-700">Admin</span></div>
        </div>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header ref={headerRef} className="bg-white/80 backdrop-blur border-b border-gray-200 px-8 py-6 shadow-lg rounded-b-3xl flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-pink-500 to-red-500 p-3 rounded-xl shadow-lg animate__animated animate__pulse animate__infinite">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight drop-shadow-lg">Disaster Response Coordination</h1>
              <p className="text-base text-gray-600 font-medium">Real-time emergency management platform with <span className="text-pink-500 font-bold">AI verification</span></p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shadow-md">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              System Online
            </Badge>
            <NotificationSystem />
            <Button onClick={() => setShowCreateForm(true)} className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-red-500 hover:to-pink-500 shadow-lg text-white font-semibold px-6 py-2 rounded-xl">
              <Plus className="h-5 w-5 mr-2" />
              Report Disaster
            </Button>
          </div>
        </header>
        <main className="flex-grow px-8 pb-8">
          {/* Stats Overview */}
          <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <Card className="stat-card glass-card bg-gradient-to-br from-pink-100 to-red-50 shadow-[0_4px_32px_0_rgba(255,0,80,0.10)] border-pink-200">
              <CardContent className="p-8 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pink-700">Active Disasters</p>
                  <StatNumber value={stats.activeDisasters} color="text-pink-600" />
                </div>
                <AlertTriangle className="h-10 w-10 text-pink-500 drop-shadow-[0_2px_8px_rgba(255,0,80,0.25)]" />
              </CardContent>
            </Card>
            <Card className="stat-card glass-card bg-gradient-to-br from-blue-100 to-blue-50 shadow-[0_4px_32px_0_rgba(0,120,255,0.10)] border-blue-200">
              <CardContent className="p-8 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Reports</p>
                  <StatNumber value={stats.totalReports} color="text-blue-600" />
                </div>
                <Users className="h-10 w-10 text-blue-500 drop-shadow-[0_2px_8px_rgba(0,120,255,0.25)]" />
              </CardContent>
            </Card>
            <Card className="stat-card glass-card bg-gradient-to-br from-green-100 to-green-50 shadow-[0_4px_32px_0_rgba(0,200,80,0.10)] border-green-200">
              <CardContent className="p-8 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Resources Deployed</p>
                  <StatNumber value={stats.resourcesDeployed} color="text-green-600" />
                </div>
                <MapPin className="h-10 w-10 text-green-500 drop-shadow-[0_2px_8px_rgba(0,200,80,0.25)]" />
              </CardContent>
            </Card>
            <Card className="stat-card glass-card bg-gradient-to-br from-purple-100 to-gray-50 shadow-[0_4px_32px_0_rgba(120,0,255,0.10)] border-purple-200">
              <CardContent className="p-8 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Last Update</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.lastUpdate}</p>
                </div>
                <Clock className="h-10 w-10 text-purple-500 drop-shadow-[0_2px_8px_rgba(120,0,255,0.18)]" />
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs (now only show content, not tab bar) */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="h-6 w-6 mr-2 text-yellow-500 animate-bounce" />
                      Real-time Updates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RealtimeUpdates />
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Recent Disasters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<TabLoading />}>
                      <DisasterList limit={5} />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="disasters">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Disaster Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<TabLoading />}>
                    <DisasterList />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="updates">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Official Updates</CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<TabLoading />}>
                    <OfficialUpdatesFeed />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Social Media Intelligence</CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<TabLoading />}>
                    <SocialMediaFeed />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Resource Deployment Map</CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<TabLoading />}>
                    <ResourcesMap />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Analytics Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<TabLoading />}>
                    <AnalyticsDashboard />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      {/* SidebarMenuItem component */}
      <style jsx>{`
        .sidebar-menu-item {
          @apply flex items-center px-4 py-3 rounded-xl font-semibold text-gray-700 transition-all duration-200 cursor-pointer hover:bg-pink-100 hover:text-pink-700;
        }
        .sidebar-menu-item.active {
          @apply bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg;
        }
      `}</style>

      {/* Create Disaster Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <DisasterForm onClose={() => setShowCreateForm(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

function SidebarMenuItem({ icon, label, value, activeTab, setActiveTab }: any) {
  return (
    <div
      className={`sidebar-menu-item${activeTab === value ? " active" : ""}`}
      onClick={() => setActiveTab(value)}
    >
      {icon}
      <span>{label}</span>
    </div>
  )
}
