# 🚨 Disaster Response Coordination Platform

A comprehensive MERN stack application for real-time disaster management and response coordination. This platform aggregates data from multiple sources to provide emergency responders with critical information during disasters.

## 🌟 Features

### Core Disaster Management
- **CRUD Operations**: Create, read, update, and delete disaster records with full audit trails
- **Location Intelligence**: AI-powered location extraction from descriptions using Google Gemini API
- **Geospatial Mapping**: Convert locations to coordinates using multiple mapping services
- **Priority Classification**: Advanced keyword-based prioritization system
- **Real-time Updates**: WebSocket-powered live updates across all components

### AI-Powered Features
- **Location Extraction**: Google Gemini API extracts location names from disaster descriptions
- **Image Verification**: AI analysis of uploaded images for authenticity and disaster context
- **Smart Prioritization**: Machine learning-based classification of social media posts
- **Content Analysis**: Automatic tagging and categorization of reports

### Social Media Integration
- **Multi-Platform Support**: Twitter API, Bluesky API, and mock data sources
- **Real-time Monitoring**: Live social media feed with priority alerts
- **Keyword Filtering**: Intelligent filtering based on disaster types and keywords
- **Credibility Scoring**: Automated assessment of post reliability

### Geospatial Resource Management
- **Nearby Resource Lookup**: Find resources within specified radius using PostGIS
- **Interactive Mapping**: Leaflet-based map with custom markers
- **Location-based Queries**: Efficient geospatial searches with proper indexing
- **Resource Tracking**: Real-time availability and capacity monitoring

### Official Updates Aggregation
- **Web Scraping**: Automated collection from FEMA, Red Cross, and government sources
- **Categorized Updates**: Filter by source, severity, and category
- **Caching System**: Intelligent caching to handle rate limits
- **Real-time Feeds**: Live updates from official sources

### Advanced Features
- **Priority Alert System**: Automated detection of urgent situations
- **Comprehensive Caching**: Redis-like caching with TTL for all external API calls
- **Rate Limiting**: Multi-tier rate limiting for API protection
- **Structured Logging**: Detailed logging for monitoring and debugging
- **Error Handling**: Robust error handling with graceful fallbacks

## 🏗️ Architecture

### Backend (Node.js/Express)
```
backend/
├── src/
│   ├── controllers/     # API endpoint handlers
│   ├── middleware/      # Auth, rate limiting, caching
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic and external APIs
│   ├── database/        # Database schema and migrations
│   └── utils/           # Logging and utilities
```

### Frontend (React)
```
frontend/
├── src/
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API and WebSocket services
│   └── styles/          # CSS and Tailwind config
```

### Database (Supabase/PostgreSQL)
- **PostGIS Extension**: Geospatial queries and indexing
- **JSONB Support**: Flexible data storage for audit trails and analysis
- **Custom Functions**: Optimized geospatial queries
- **Comprehensive Indexing**: Performance optimization for all query types

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Google Gemini API key
- Optional: Twitter API, Mapbox API keys

### Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories:

#### Backend (.env)
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Optional APIs
GOOGLE_MAPS_API_KEY=your_google_maps_key
MAPBOX_ACCESS_TOKEN=your_mapbox_token
TWITTER_BEARER_TOKEN=your_twitter_token
BLUESKY_ACCESS_TOKEN=your_bluesky_token

# Server
PORT=5000
NODE_ENV=development
CACHE_TTL=3600000
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WEBSOCKET_URL=http://localhost:5000
REACT_APP_DEFAULT_USER_ID=netrunnerX
REACT_APP_DEBUG_MODE=true
```

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd disaster-manage
```

2. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Set up database**
```bash
# Run the schema in your Supabase SQL editor
# Copy contents of backend/src/database/schema.sql
```

4. **Start the application**
```bash
# Backend (from backend directory)
npm run dev

# Frontend (from frontend directory)
npm start
```

## 📚 API Documentation

### Disaster Management

#### Create Disaster
```http
POST /api/disasters
Content-Type: application/json

{
  "title": "Flood in Lower Manhattan",
  "location_name": "Lower Manhattan, NYC",
  "description": "Severe flooding affecting downtown area",
  "tags": ["flood", "urgent"]
}
```

#### Get Disasters
```http
GET /api/disasters?tag=flood&limit=20&offset=0
```

#### Update Disaster
```http
PUT /api/disasters/:id
Content-Type: application/json

{
  "title": "Updated title",
  "priority": "high"
}
```

### Social Media Integration

#### Get Social Media Reports
```http
GET /api/disasters/:id/social-media?keywords=flood,emergency&analyze=true
```

#### Analyze Social Media Post
```http
POST /api/social-media/analyze
Content-Type: application/json

{
  "post": {
    "id": "123",
    "post": "URGENT: Need help in downtown area! #floodrelief",
    "user": "citizen1"
  }
}
```

### Geospatial Resources

#### Get Nearby Resources
```http
GET /api/disasters/:id/resources?lat=40.7128&lon=-74.0060&radius=10000&type=shelter
```

### Official Updates

#### Get Official Updates
```http
GET /api/disasters/:id/official-updates?sources=fema,redcross&category=shelter
```

### Image Verification

#### Verify Image
```http
POST /api/disasters/:id/verify-image
Content-Type: application/json

{
  "image_url": "https://example.com/disaster-image.jpg"
}
```

### Geocoding

#### Geocode Location
```http
POST /api/geocode
Content-Type: application/json

{
  "location_name": "Lower Manhattan, NYC"
}
```

## 🔧 Advanced Configuration

### Database Optimization

1. **Enable PostGIS extension** in Supabase
2. **Create geospatial indexes** for performance
3. **Set up custom functions** for complex queries

### Caching Strategy

- **API Responses**: 1-hour TTL for external API calls
- **Geocoding**: 24-hour TTL for location data
- **Social Media**: 15-minute TTL for real-time data
- **Official Updates**: 1-hour TTL for web scraping

### Rate Limiting

- **Read Operations**: 100 requests/minute
- **Write Operations**: 20 requests/minute
- **External APIs**: 10 requests/minute
- **Image Verification**: 5 requests/minute

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### API Testing
```bash
# Test all endpoints
curl -X GET http://localhost:5000/health

# Test disaster creation
curl -X POST http://localhost:5000/api/disasters \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Disaster","description":"Test description"}'
```

## 📊 Monitoring and Logging

### Structured Logging
The application uses structured logging with different levels:
- `info`: General application events
- `warn`: Non-critical issues
- `error`: Critical errors
- `debug`: Detailed debugging information

### Health Checks
```http
GET /health
```

### Performance Metrics
- API response times
- Database query performance
- Cache hit rates
- WebSocket connection status

## 🔒 Security Features

- **CORS Configuration**: Proper origin validation
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses
- **Authentication**: User-based access control

## 🚀 Deployment

### Backend Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to your preferred platform
# (Vercel, Netlify, etc.)
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database URLs
3. Set up proper CORS origins
4. Configure SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Google Gemini API** for AI-powered features
- **Supabase** for database and real-time features
- **Leaflet** for interactive mapping
- **Socket.IO** for real-time communication
- **Tailwind CSS** for styling

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API examples

---

**Built with ❤️ for emergency response coordination**