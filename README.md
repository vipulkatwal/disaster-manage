# Geo Aid - Disaster Response Coordination Platform

A comprehensive disaster response coordination platform built with Node.js/Express backend and React frontend, featuring real-time updates, social media monitoring, and geospatial capabilities.

## 🌟 Features

- **Real-time Disaster Management**: Live updates and coordination
- **Social Media Integration**: Monitor Twitter, Facebook, Instagram, and Bluesky
- **Official Updates**: Scrape and display government agency updates
- **Geospatial Mapping**: Interactive resource and disaster mapping
- **AI-Powered Analysis**: Location extraction and image verification
- **Priority Alert System**: Real-time emergency notifications
- **Caching & Performance**: Optimized for high-traffic scenarios

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Google Gemini API key
- Google Maps API key

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/vipulkatwal/disaster-manage.git
   cd disaster-manage
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp env.example .env
   # Edit .env with your API keys
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Database Setup**
   - Create a Supabase project
   - Run the SQL commands from `backend/database/schema.sql`
   - Update environment variables with your Supabase credentials

## 🛠️ Technology Stack

### Backend
- **Node.js/Express**: Server framework
- **Supabase**: Database and authentication
- **Socket.IO**: Real-time communication
- **Google Gemini API**: AI-powered analysis
- **Cheerio**: Web scraping
- **Winston**: Logging
- **Helmet**: Security middleware

### Frontend
- **React 18**: UI framework
- **Tailwind CSS**: Styling
- **React Router**: Navigation
- **Socket.IO Client**: Real-time updates
- **Leaflet**: Interactive maps
- **Framer Motion**: Animations
- **React Hook Form**: Form handling

## 📋 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
BLUESKY_IDENTIFIER=your_bluesky_identifier
BLUESKY_PASSWORD=your_bluesky_password
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5000
```

## 🚀 Deployment

### Render Deployment (Recommended)

1. **Fork/Clone** this repository to your GitHub account
2. **Sign up** for a free Render account
3. **Deploy using render.yaml**:
   - Go to Render Dashboard
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Configure environment variables
   - Deploy

### Manual Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📁 Project Structure

```
disaster-manage/
├── backend/                 # Express.js backend
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   └── app.js          # Main application file
│   ├── database/           # Database schema
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── styles/         # CSS styles
│   │   └── utils/          # Utility functions
│   └── package.json
├── render.yaml             # Render deployment config
└── README.md
```

## 🔧 API Endpoints

### Disaster Management
- `GET /api/disasters` - List all disasters
- `POST /api/disasters` - Create new disaster
- `GET /api/disasters/:id` - Get disaster details
- `PUT /api/disasters/:id` - Update disaster
- `DELETE /api/disasters/:id` - Delete disaster

### Social Media
- `GET /api/social-media/posts` - Get social media posts
- `POST /api/social-media/analyze` - Analyze post sentiment
- `GET /api/social-media/trends` - Get trending topics

### Official Updates
- `GET /api/browse/official-updates` - Get official updates
- `POST /api/browse/scrape` - Scrape new updates

### Geocoding
- `GET /api/geocoding/search` - Search locations
- `POST /api/geocoding/reverse` - Reverse geocoding

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for database and authentication
- [Google AI](https://ai.google.dev/) for Gemini API
- [Render](https://render.com) for hosting
- [Tailwind CSS](https://tailwindcss.com) for styling
- [React](https://reactjs.org) for the frontend framework

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the [deployment guide](./DEPLOYMENT.md)
- Review the [requirements compliance](./REQUIREMENTS_COMPLIANCE.md)

---

**Built with ❤️ for disaster response coordination**