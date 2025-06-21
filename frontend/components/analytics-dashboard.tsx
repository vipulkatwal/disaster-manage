"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp, AlertTriangle, CheckCircle, Clock, MapPin, Users } from "lucide-react"

interface AnalyticsData {
  overview: {
    totalDisasters: number
    activeDisasters: number
    totalReports: number
    totalResources: number
    averageResponseTime: string
    verificationRate: number
  }
  disastersByPriority: Record<string, number>
  disastersByStatus: Record<string, number>
  resourceUtilization: Record<string, number[]>
  topTags: Record<string, number>
  timeline: Array<{
    date: string
    disasters: number
    reports: number
    critical: number
  }>
  geographicDistribution: Array<{
    location: string
    count: number
  }>
  verificationMetrics: {
    verified: number
    pending: number
    suspicious: number
  }
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [timeframe, setTimeframe] = useState("24h")
  const [loading, setLoading] = useState(true)

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/dashboard?timeframe=${timeframe}`)
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error("Failed to load analytics:", error)
    } finally {
      setLoading(false)
    }
  }, [timeframe])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  // Memoize chart colors
  const COLORS = useMemo(() => ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"], [])

  // Memoize processed chart data
  const chartData = useMemo(() => {
    if (!data) return null

    const priorityData = Object.entries(data.disastersByPriority).map(([priority, count]) => ({
      priority,
      count,
      color:
        {
          critical: "#ef4444",
          high: "#f97316",
          medium: "#eab308",
          low: "#22c55e",
        }[priority] || "#6b7280",
    }))

    const statusData = Object.entries(data.disastersByStatus).map(([status, count]) => ({
      status,
      count,
    }))

    const tagData = Object.entries(data.topTags)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    return { priorityData, statusData, tagData }
  }, [data])

  // Memoize timeframe buttons
  const timeframeButtons = useMemo(() => [
    { key: "1h", label: "1h" },
    { key: "24h", label: "24h" },
    { key: "7d", label: "7d" },
    { key: "30d", label: "30d" },
  ], [])

  // Memoize overview cards
  const overviewCards = useMemo(() => {
    if (!data) return []

    return [
      {
        title: "Total Disasters",
        value: data.overview.totalDisasters,
        subtitle: `${data.overview.activeDisasters} active`,
        color: "text-gray-900",
        icon: AlertTriangle,
        iconColor: "text-red-600",
      },
      {
        title: "Total Reports",
        value: data.overview.totalReports,
        subtitle: `${data.overview.verificationRate}% verified`,
        color: "text-blue-600",
        icon: Users,
        iconColor: "text-blue-600",
      },
      {
        title: "Resources",
        value: data.overview.totalResources,
        subtitle: "Available",
        color: "text-green-600",
        icon: MapPin,
        iconColor: "text-green-600",
      },
      {
        title: "Avg Response",
        value: data.overview.averageResponseTime,
        subtitle: "Response time",
        color: "text-purple-600",
        icon: Clock,
        iconColor: "text-purple-600",
      },
    ]
  }, [data])

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>
  }

  if (!data || !chartData) {
    return <div className="text-center py-8">Failed to load analytics data</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 rounded-2xl bg-white/70 backdrop-blur-[2px] border border-pink-100 shadow-inner mb-2">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <div className="flex gap-2">
          {timeframeButtons.map((button) => (
            <Button
              key={button.key}
              variant={timeframe === button.key ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe(button.key)}
              className="rounded-xl"
            >
              {button.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewCards.map((card, index) => {
          const IconComponent = card.icon
          return (
            <Card key={index} className="bg-white/80 rounded-2xl border border-pink-100 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                    <p className="text-sm text-gray-500">{card.subtitle}</p>
                  </div>
                  <IconComponent className={`h-8 w-8 ${card.iconColor}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-white/70 border border-pink-100 mb-2">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 rounded-2xl border border-pink-100 shadow-md">
              <CardHeader>
                <CardTitle>Disaster Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.timeline} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="disasters" stackId="1" stroke="#ef4444" fill="url(#disasterGradient)" strokeWidth={3} />
                    <Area type="monotone" dataKey="reports" stackId="1" stroke="#3b82f6" fill="url(#reportGradient)" strokeWidth={3} />
                    <Area type="monotone" dataKey="critical" stackId="1" stroke="#dc2626" fill="url(#criticalGradient)" strokeWidth={3} />
                    <defs>
                      <linearGradient id="disasterGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="reportGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="criticalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white/80 rounded-2xl border border-pink-100 shadow-md">
              <CardHeader>
                <CardTitle>Top Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.tagData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tag" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                      {chartData.tagData.map((entry, index) => (
                        <Cell key={`cell-tag-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 rounded-2xl border border-pink-100 shadow-md">
              <CardHeader>
                <CardTitle>Disasters by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.priorityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ priority, percent, count }) =>
                        count > 0 ? `${priority} ${(percent * 100).toFixed(0)}%` : ""
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {chartData.priorityData.map((entry, index) => (
                        <Cell key={`cell-priority-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex flex-wrap gap-4 justify-center mt-4">
                  {chartData.priorityData.map((entry, index) => (
                    entry.count > 0 && (
                      <div key={entry.priority} className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: entry.color }}></span>
                        <span className="text-sm text-gray-700 capitalize">{entry.priority}</span>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 rounded-2xl border border-pink-100 shadow-md">
              <CardHeader>
                <CardTitle>Disasters by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.statusData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#22c55e" radius={[8, 8, 0, 0]}>
                      {chartData.statusData.map((entry, index) => (
                        <Cell key={`cell-status-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="verification" className="space-y-6">
          <Card className="bg-white/80 rounded-2xl border border-pink-100 shadow-md">
            <CardHeader>
              <CardTitle>Verification Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{data.verificationMetrics.verified}</div>
                  <div className="text-sm text-gray-600">Verified Reports</div>
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{data.verificationMetrics.pending}</div>
                  <div className="text-sm text-gray-600">Pending Review</div>
                  <Clock className="h-8 w-8 text-yellow-600 mx-auto mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{data.verificationMetrics.suspicious}</div>
                  <div className="text-sm text-gray-600">Suspicious</div>
                  <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-6">
          <Card className="bg-white/80 rounded-2xl border border-pink-100 shadow-md">
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.geographicDistribution} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]}>
                    {data.geographicDistribution.map((entry, index) => (
                      <Cell key={`cell-geo-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
