# Backend Deployment Guide for Render

## Overview
This guide will help you deploy only the backend of your Geo Aid disaster response platform on Render, while keeping your frontend on Vercel.

## Prerequisites
1. Your frontend is already deployed on Vercel
2. A Render account (free tier)
3. Required API keys (see below)

## Required API Keys

### 1. Supabase (Required)
- Go to [Supabase](https://supabase.com) and create a new project
- Get your project URL and anon key from Settings > API
- Required variables:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`

### 2. Google Gemini API (Required)
- Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create a new API key
- Required variable:
  - `GEMINI_API_KEY`

### 3. Google Maps API (Required)
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Enable Maps JavaScript API and Geocoding API
- Create an API key
- Required variable:
  - `GOOGLE_MAPS_API_KEY`

### 4. Social Media APIs (Optional)
- **Twitter**: Get Bearer Token from Twitter Developer Portal
- **Bluesky**: Create account and get credentials
- Required variables:
  - `TWITTER_BEARER_TOKEN`
  - `BLUESKY_IDENTIFIER`
  - `BLUESKY_PASSWORD`

## Deployment Steps

### Step 1: Prepare Your Repository
1. Ensure your repository is pushed to GitHub
2. Make sure the `render-backend.yaml` file is in your root directory
3. Verify your backend dependencies are properly listed in `backend/package.json`

### Step 2: Deploy on Render

#### Option A: Using render-backend.yaml (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render-backend.yaml` file
5. Configure environment variables (see below)
6. Deploy the backend service

#### Option B: Manual Deployment
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `disaster-manage-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free

### Step 3: Configure Environment Variables

In your backend service settings, add these environment variables:

```
NODE_ENV=production
PORT=5000
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
BLUESKY_IDENTIFIER=your_bluesky_identifier_here
BLUESKY_PASSWORD=your_bluesky_password_here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CACHE_TTL=3600
```

### Step 4: Update Frontend Environment Variables

After your backend is deployed, update your Vercel frontend environment variables:

1. Go to your Vercel dashboard
2. Select your frontend project
3. Go to Settings → Environment Variables
4. Add/Update these variables:

```
REACT_APP_API_URL=https://your-backend-service-name.onrender.com
REACT_APP_WS_URL=wss://your-backend-service-name.onrender.com
```

**Important**: Replace `your-backend-service-name` with the actual name of your backend service on Render.

### Step 5: Database Setup
1. In your Supabase project, go to SQL Editor
2. Run the SQL commands from `backend/database/schema.sql`
3. Insert sample data if needed

### Step 6: Test the Connection
1. Check that your backend service is running (green status on Render)
2. Test the API endpoints using your backend URL
3. Verify that your Vercel frontend can connect to the Render backend

## API Endpoints to Test

Once deployed, test these endpoints:

- **Health Check**: `https://your-backend-service.onrender.com/health`
- **API Info**: `https://your-backend-service.onrender.com/api`
- **Disasters**: `https://your-backend-service.onrender.com/api/disasters`

## Troubleshooting

### Common Issues

#### 1. CORS Errors
- **Issue**: Frontend can't connect to backend
- **Solution**: The backend is already configured to accept requests from any origin in production

#### 2. Environment Variables
- **Issue**: API calls failing
- **Solution**: Verify all environment variables are set correctly in Render

#### 3. Database Connection
- **Issue**: Database queries failing
- **Solution**: Verify Supabase credentials and database schema

#### 4. WebSocket Connection
- **Issue**: Real-time features not working
- **Solution**: Ensure `REACT_APP_WS_URL` uses `wss://` protocol

### Free Tier Limitations
- **Sleep Mode**: Service sleeps after 15 minutes of inactivity
- **Build Time**: Limited to 500 minutes per month
- **Bandwidth**: 100GB per month

## Monitoring

### Health Checks
- Monitor service status in Render dashboard
- Check logs regularly for errors
- Test API endpoints periodically

### Logs
- View logs in Render dashboard under your service
- Monitor for errors and performance issues
- Check for rate limiting or timeout issues

## Security Considerations

### Environment Variables
- Never commit API keys to version control
- Use Render's environment variable system
- Rotate API keys regularly

### API Security
- Rate limiting is already configured
- CORS is properly set up for production
- Input validation is implemented

## Cost Optimization
- Free tier is sufficient for development and small-scale use
- Monitor usage to avoid unexpected charges
- Consider paid plans for production workloads

## Support
- Render Documentation: https://render.com/docs
- Supabase Documentation: https://supabase.com/docs
- Project Issues: Check the GitHub repository

## Next Steps
1. Deploy your backend using the guide above
2. Update your Vercel frontend environment variables
3. Test the full application
4. Monitor performance and logs
5. Set up monitoring and alerts if needed