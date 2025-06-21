import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Menu,
  Bell,
  Shield,
  Wifi,
  WifiOff,
  User,
  AlertTriangle,
  MessageCircle,
  Globe,
  LayoutDashboard
} from 'lucide-react';

const Header = ({ user, connected, onMenuClick }) => {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/disasters':
        return 'Disaster Management';
      case '/disasters/new':
        return 'Report New Disaster';
      case '/social-media':
        return 'Social Media Monitoring';
      case '/browse':
        return 'Official Updates';
      case '/map':
        return 'Resource Map';
      default:
        if (location.pathname.includes('/disasters/') && location.pathname.includes('/report')) {
          return 'Submit Report';
        }
        return 'Disaster Response';
    }
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-4 z-50 h-16"
    >
      <div className="container mx-auto h-full px-4">
        <div className="relative w-full h-full flex items-center justify-between rounded-full border border-gray-200/10 bg-gray-800/60 backdrop-blur-xl shadow-2xl shadow-black/20 px-6">

          {/* Left Section - Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-bold text-white">
                  Geo Aid
                </h1>
                <p className="text-xs text-gray-400 -mt-1">Coordination Platform</p>
              </div>
            </Link>
          </div>

          {/* Center Navigation */}
          <nav className="hidden lg:flex">
              <div className="flex items-center space-x-1 bg-gray-900/50 p-1 rounded-full border border-white/10">
                <NavLink to="/" active={location.pathname === '/'}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="ml-1.5">Dashboard</span>
                </NavLink>
                <NavLink to="/disasters" active={location.pathname.startsWith('/disasters')}>
                  <Shield className="w-4 h-4" />
                  <span className="ml-1.5">Disasters</span>
                </NavLink>
                <NavLink to="/social-media" active={location.pathname === '/social-media'}>
                  <MessageCircle className="w-4 h-4" />
                  <span className="ml-1.5">Social Media</span>
                </NavLink>
                <NavLink to="/browse" active={location.pathname === '/browse'}>
                  <Globe className="w-4 h-4" />
                  <span className="ml-1.5">Browse</span>
                </NavLink>
                <NavLink to="/map" active={location.pathname === '/map'}>
                  <div className="w-4 h-4 flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                  <span className="ml-1.5">Map</span>
                </NavLink>
              </div>
            </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link
              to="/disasters/new"
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-red-500/50"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Report Emergency</span>
            </Link>

            <button className="relative p-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-gray-800"></span>
            </button>

            <div className="relative group">
              <button className="flex items-center space-x-2">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center ring-2 ring-offset-2 ring-offset-gray-800 ring-transparent group-hover:ring-blue-400 transition-all duration-300">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-sm font-medium text-white">{user?.name || 'Coordinator'}</p>
                  <p className="text-xs text-gray-400 capitalize">{user?.role || 'admin'}</p>
                </div>
              </button>

              {/* User Dropdown */}
              <div className="absolute right-0 top-full mt-3 w-48 bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-2">
                <div className="px-3 py-2 border-b border-white/10 mb-2">
                  <p className="font-medium text-white">{user?.name || 'Emergency Coordinator'}</p>
                  <p className="text-sm text-gray-400">{user?.username || 'netrunnerX'}</p>
                </div>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/10 rounded-lg transition-colors">
                  Profile Settings
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/10 rounded-lg transition-colors">
                  Preferences
                </button>
                <div className="h-px bg-white/10 my-1"></div>
                <button className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                  Sign Out
                </button>
              </div>
            </div>

            <button
              onClick={onMenuClick}
              className="p-2.5 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 lg:hidden flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Page Title */}
      <div className="lg:hidden px-4 pb-3 border-t border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h2>
      </div>
    </motion.header>
  );
};

const NavLink = ({ to, children, active }) => (
  <Link
    to={to}
    className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
      active
        ? 'bg-white text-gray-900 shadow-md'
        : 'text-gray-300 hover:bg-white hover:text-gray-900'
    }`}
  >
    {children}
  </Link>
);

export default Header;