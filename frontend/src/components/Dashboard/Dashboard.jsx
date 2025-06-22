import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  MapPin,
  Clock,
  Users,
  TrendingUp,
  Activity,
  Shield,
  Plus,
  ExternalLink,
  RefreshCw,
  Bell,
  BarChart3,
  Map,
  FileText,
  Zap,
  MessageCircle,
  Globe
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import SocialMediaFeed from '../SocialMediaFeed/SocialMediaFeed';
import OfficialUpdates from '../OfficialUpdates/OfficialUpdates';

const Dashboard = ({ disasters, selectedDisaster, onDisasterSelect, user }) => {
  const { disasters: disasterApi, resources } = useApi();
  const [stats, setStats] = useState({
    totalDisasters: 0,
    urgentEvents: 0,
    activeResources: 0,
    recentReports: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSocialMedia, setShowSocialMedia] = useState(false);
  const [showOfficialUpdates, setShowOfficialUpdates] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [disasters]);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);

      const urgentCount = disasters.filter(d => ['urgent', 'high'].includes(d.priority?.toLowerCase())).length;

      setStats({
        totalDisasters: disasters.length,
        urgentEvents: urgentCount,
        activeResources: Math.floor(disasters.length * 2.5 + 5),
        recentReports: Math.floor(disasters.length * 1.8 + 3)
      });

      const activity = disasters.slice(0, 5).map(d => ({
        id: d.id,
        type: d.type || 'disaster',
        title: d.title,
        location: d.location_name,
        timestamp: d.created_at
      }));

      setRecentActivity(activity);

      setActiveAlerts(disasters.filter(d => d.priority?.toLowerCase() === 'urgent').slice(0, 2));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'disaster_reported':
        return <AlertTriangle className="w-4 h-4" />;
      case 'resource_added':
        return <Shield className="w-4 h-4" />;
      case 'report_submitted':
        return <FileText className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type, priority) => {
    if (priority === 'high') return 'text-red-600 bg-red-100';
    if (type === 'disaster_reported') return 'text-orange-600 bg-orange-100';
    if (type === 'resource_added') return 'text-green-600 bg-green-100';
    return 'text-blue-600 bg-blue-100';
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '...';
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const statCards = [
    {
      title: 'Total Disasters',
      value: stats.totalDisasters,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Urgent Events',
      value: stats.urgentEvents,
      icon: Zap,
      color: 'from-orange-500 to-red-500',
      change: '+5%',
      changeType: 'increase'
    },
    {
      title: 'Active Resources',
      value: stats.activeResources,
      icon: Shield,
      color: 'from-green-500 to-green-600',
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'Recent Reports',
      value: stats.recentReports,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      change: '+15%',
      changeType: 'increase'
    }
  ];

  const quickActions = [
    {
      title: 'Report Emergency',
      description: 'Submit a new disaster report',
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      link: '/disasters/new'
    },
    {
      title: 'View Map',
      description: 'See resources and disasters on map',
      icon: Map,
      color: 'from-blue-500 to-blue-600',
      link: '/map'
    },
    {
      title: 'Manage Disasters',
      description: 'View and manage all disasters',
      icon: BarChart3,
      color: 'from-green-500 to-green-600',
      link: '/disasters'
    },
    {
      title: 'Analytics',
      description: 'View detailed analytics and reports',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      link: '/analytics'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner-lg mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back, {user?.name || 'Coordinator'}
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening with emergency response today</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <Link to="/disasters/new" className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Report Emergency</span>
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-8">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard title="Total Disasters" value={stats.totalDisasters} description="+12% vs last week" icon={AlertTriangle} gradient="from-red-500 to-orange-500" />
            <StatCard title="Urgent Events" value={stats.urgentEvents} description="+5% vs last week" icon={Zap} gradient="from-orange-400 to-yellow-400" />
            <StatCard title="Active Resources" value={stats.activeResources} description="+8% vs last week" icon={Shield} gradient="from-green-500 to-teal-500" />
            <StatCard title="Recent Reports" value={stats.recentReports} description="+15% vs last week" icon={FileText} gradient="from-blue-500 to-indigo-500" />
      </div>

          {/* Recent Disasters Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80">
            <div className="p-4 border-b border-gray-200/80 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Recent Disasters</h3>
              <Link to="/disasters" className="text-sm font-medium text-red-600 hover:text-red-800">View all disasters</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Disaster</th>
                    <th scope="col" className="px-6 py-3">Location</th>
                    <th scope="col" className="px-6 py-3">Priority</th>
                    <th scope="col" className="px-6 py-3">Time</th>
                    <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {disasters.slice(0, 5).map(disaster => (
                    <tr key={disaster.id} className="bg-white border-b hover:bg-gray-50">
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${getPriorityPill(disaster.priority).iconBg}`}>
                            <AlertTriangle className={`w-3 h-3 ${getPriorityPill(disaster.priority).iconColor}`} />
          </div>
                          <div>
                            <div>{disaster.title}</div>
                            <div className="text-xs text-gray-400 font-normal truncate max-w-xs">{disaster.description}</div>
                      </div>
                    </div>
                      </th>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                           <MapPin className="w-3.5 h-3.5 text-gray-400" />
                           <span>{disaster.location_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPriorityPill(disaster.priority).pill}`}>
                          {disaster.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">{getTimeAgo(disaster.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/disasters/${disaster.id}`} className="font-medium text-red-600 hover:underline">Add Report</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
          </div>
            </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <QuickAction key={action.title} title={action.title} description={action.description} icon={action.icon} link={action.link} />
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">System Status</h3>
            <div className="space-y-3 text-sm">
                <SystemStatusItem label="API Services" status="Operational" />
                <SystemStatusItem label="Real-time Updates" status="Active" />
                <SystemStatusItem label="External APIs" status="Degraded" />
                <SystemStatusItem label="Database" status="Healthy" />
            </div>
          </div>

          {/* Active Alerts */}
          {activeAlerts.length > 0 && (
            <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg p-5 text-white">
              <div className="flex items-center space-x-3">
                <Bell className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Active Alerts</h3>
              </div>
              <p className="mt-2 text-sm text-red-100">{activeAlerts.length} urgent disasters require immediate attention</p>
              <Link to="/disasters?priority=urgent" className="mt-4 inline-block w-full text-center bg-white/90 text-red-600 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-white transition-colors">
                View Urgent
              </Link>
            </div>
          )}
          </div>
      </div>

      {selectedDisaster && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Social Media Feeds</h3>
                <button
                  onClick={() => setShowSocialMedia(!showSocialMedia)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{showSocialMedia ? 'Hide' : 'Show'}</span>
                </button>
              </div>

              {showSocialMedia ? (
                <SocialMediaFeed
                  disasterId={selectedDisaster.id}
                  keywords={selectedDisaster.tags?.join(',')}
                />
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Click "Show" to load social media feeds</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Official Updates</h3>
                <button
                  onClick={() => setShowOfficialUpdates(!showOfficialUpdates)}
                  className="flex items-center space-x-2 text-green-600 hover:text-green-800"
                >
                  <Globe className="w-4 h-4" />
                  <span>{showOfficialUpdates ? 'Hide' : 'Show'}</span>
                </button>
              </div>

              {showOfficialUpdates ? (
                <OfficialUpdates
                  disasterId={selectedDisaster.id}
                />
              ) : (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Click "Show" to load official updates</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
            </div>
  );
};

// Sub-components for a cleaner structure
const StatCard = ({ title, value, description, icon: Icon, gradient }) => (
  <div className={`bg-gradient-to-br p-5 rounded-xl text-white shadow-lg ${gradient}`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="font-semibold text-white/90">{title}</p>
        <p className="text-4xl font-bold mt-2">{value}</p>
                        </div>
      <div className="p-2 bg-black/20 rounded-lg">
        <Icon className="w-6 h-6" />
                        </div>
                      </div>
    <p className="text-sm opacity-80 mt-2">{description}</p>
                      </div>
);

const QuickAction = ({ title, description, icon: Icon, link }) => (
  <Link to={link} className="flex items-center space-x-4 p-3 -m-3 rounded-lg hover:bg-gray-100 transition-colors group">
    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
      <Icon className="w-5 h-5 text-gray-600" />
          </div>
    <div>
      <p className="font-semibold text-gray-800">{title}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
    <ExternalLink className="w-4 h-4 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
  </Link>
);

const SystemStatusItem = ({ label, status }) => {
    const statusStyles = {
        'Operational': 'bg-green-500',
        'Active': 'bg-green-500 animate-pulse',
        'Degraded': 'bg-yellow-500',
        'Healthy': 'bg-green-500',
    };
    return (
        <div className="flex justify-between items-center">
            <span>{label}</span>
            <div className="flex items-center space-x-2">
                <div className={`w-2.5 h-2.5 rounded-full ${statusStyles[status] || 'bg-gray-500'}`}></div>
                <span className="font-medium text-gray-700">{status}</span>
            </div>
    </div>
  );
};

const getPriorityPill = (priority) => {
    switch (priority?.toLowerCase()) {
        case 'urgent':
            return { pill: 'bg-red-100 text-red-700', iconBg: 'bg-red-100', iconColor: 'text-red-600'};
        case 'high':
            return { pill: 'bg-orange-100 text-orange-700', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' };
        case 'medium':
            return { pill: 'bg-yellow-100 text-yellow-800', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-700' };
        default:
            return { pill: 'bg-blue-100 text-blue-700', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' };
    }
};

export default Dashboard;