import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  RefreshCw,
  Filter,
  Search,
  AlertTriangle,
  Clock,
  Heart,
  Share,
  Tag,
  MapPin,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';

const SocialMediaPage = () => {
  const { socialMedia } = useApi();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisasterType, setSelectedDisasterType] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    urgent: 0,
    high: 0,
    medium: 0,
    low: 0
  });

  useEffect(() => {
    loadMockSocialMediaPosts();
  }, []);

  const loadMockSocialMediaPosts = async () => {
    setLoading(true);
    try {
      const response = await socialMedia.getMockData({
        keywords: searchQuery,
        disaster_type: selectedDisasterType,
        limit: 100
      });

      if (response.success && response.data.posts) {
        setPosts(response.data.posts);
        calculateStats(response.data.posts);
        toast.success('Social media feeds loaded');
      } else {
        toast.error('Failed to load social media posts');
      }
    } catch (error) {
      console.error('Error loading social media posts:', error);
      toast.error('Error loading social media feeds');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (postsData) => {
    const statsData = {
      total: postsData.length,
      urgent: postsData.filter(p => p.priority === 'urgent').length,
      high: postsData.filter(p => p.priority === 'high').length,
      medium: postsData.filter(p => p.priority === 'medium').length,
      low: postsData.filter(p => p.priority === 'low').length
    };
    setStats(statsData);
  };

  const filteredPosts = posts.filter(post => {
    const matchesPriority = filterPriority === 'all' || post.priority === filterPriority;
    const matchesSearch = !searchQuery ||
      post.post.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  const getAvatarFallback = (username) => {
    if (!username || typeof username !== 'string' || username.length === 0) {
      return '?';
    }
    return username.charAt(0).toUpperCase();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const extractHashtags = (text) => {
    const hashtagRegex = /#\w+/g;
    return text.match(hashtagRegex) || [];
  };

  const priorityOptions = [
    { value: 'all', label: 'All Posts', count: stats.total },
    { value: 'urgent', label: 'Urgent', count: stats.urgent },
    { value: 'high', label: 'High', count: stats.high },
    { value: 'medium', label: 'Medium', count: stats.medium },
    { value: 'low', label: 'Low', count: stats.low }
  ];

  const disasterTypes = [
    { value: '', label: 'All Types' },
    { value: 'flood', label: 'Flood' },
    { value: 'fire', label: 'Fire' },
    { value: 'earthquake', label: 'Earthquake' },
    { value: 'hurricane', label: 'Hurricane' },
    { value: 'tornado', label: 'Tornado' }
  ];

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
              <MessageCircle className="w-8 h-8 text-blue-600" />
              <span>Social Media Monitoring</span>
            </h1>
            <p className="text-gray-500 mt-1">Real-time social media posts and alerts for disaster response</p>
          </div>
          <button
            onClick={loadMockSocialMediaPosts}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 mt-4 sm:mt-0 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-5"
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
            {priorityOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setFilterPriority(option.value)}
                className={`p-4 rounded-lg border text-center transition-all duration-200 ${
                  filterPriority === option.value
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl font-bold text-gray-800">{option.count}</div>
                <div className="text-sm font-medium text-gray-600">{option.label}</div>
              </button>
            ))}
          </div>
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-grow relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts by content, user, or hashtags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
            </div>
            <div className="flex items-center space-x-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedDisasterType}
                onChange={(e) => setSelectedDisasterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 w-full md:w-auto bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {disasterTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm w-full md:w-auto">
                Apply Filters
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-800">Live Social Media Feed</h2>
            <p className="text-gray-500 mt-1">Showing {filteredPosts.length} posts filtered by priority and keywords</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading
              ? Array(6).fill(0).map((_, i) => <PostCardSkeleton key={i} />)
              : filteredPosts.map(post => <PostCard key={post.id} post={post} />)
            }
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const PostCard = ({ post }) => {
  const getAvatarFallback = (username) => (!username || typeof username !== 'string' || username.length === 0) ? '?' : username.charAt(0).toUpperCase();
  const getPriorityStyling = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-700';
    }
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
            {getAvatarFallback(post.user)}
          </div>
          <div>
            <p className="font-semibold text-gray-800">@{post.user || 'anonymous'}</p>
            <p className="text-xs text-gray-500 flex items-center"><Clock className="w-3 h-3 mr-1" />{getTimeAgo(post.timestamp)}</p>
          </div>
        </div>
        {post.priority && (
          <div className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getPriorityStyling(post.priority)}`}>
            {post.priority.toUpperCase()}
          </div>
        )}
      </div>

      <p className="text-gray-700 text-sm mb-3 flex-grow">{post.post}</p>

      {post.location_name && (
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span>{post.location_name}</span>
        </div>
      )}

      {post.hashtags && post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.hashtags.map(tag => (
            <div key={tag} className="flex items-center space-x-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
              <Tag className="w-3 h-3" />
              <span>{tag.replace('#','')}</span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-gray-200/80 pt-3 mt-auto flex justify-between items-center text-sm text-gray-500">
        <button className="flex items-center space-x-2 hover:text-red-500 transition-colors"><Heart className="w-4 h-4" /><span>{post.likes || 0}</span></button>
        <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors"><Share className="w-4 h-4" /><span>Share</span></button>
        <button className="flex items-center space-x-2 hover:text-orange-500 transition-colors"><AlertTriangle className="w-4 h-4" /><span>Report</span></button>
      </div>
    </div>
  );
};

const PostCardSkeleton = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-5 animate-pulse">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
            </div>
            <div className="h-5 bg-gray-200 rounded-full w-20"></div>
        </div>
        <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="flex gap-2 mb-4">
            <div className="h-5 bg-gray-200 rounded-full w-20"></div>
            <div className="h-5 bg-gray-200 rounded-full w-24"></div>
        </div>
        <div className="border-t border-gray-200/80 pt-3 mt-auto flex justify-between items-center">
            <div className="h-5 bg-gray-200 rounded w-12"></div>
            <div className="h-5 bg-gray-200 rounded w-16"></div>
            <div className="h-5 bg-gray-200 rounded w-16"></div>
        </div>
    </div>
);

export default SocialMediaPage;