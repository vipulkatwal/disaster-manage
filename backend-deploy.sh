#!/bin/bash

# Backend Deployment Script for Render
# This script helps prepare the backend for deployment on Render

echo "🚀 Backend Deployment Script for Render"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "render-backend.yaml" ]; then
    echo "❌ Error: render-backend.yaml not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Found render-backend.yaml configuration"

# Check if backend package.json exists
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: backend/package.json not found"
    exit 1
fi

echo "✅ Found backend package.json"

# Check for environment example files
if [ ! -f "backend/env.example" ]; then
    echo "⚠️  Warning: backend/env.example not found"
else
    echo "✅ Found backend environment example"
fi

echo ""
echo "📋 Backend Deployment Checklist:"
echo "================================"
echo "1. ✅ render-backend.yaml configuration ready"
echo "2. ✅ Backend package.json exists"
echo "3. ✅ Frontend already deployed on Vercel"
echo ""
echo "🔧 Next Steps:"
echo "=============="
echo "1. Push your code to GitHub"
echo "2. Go to https://dashboard.render.com"
echo "3. Click 'New' → 'Blueprint'"
echo "4. Connect your GitHub repository"
echo "5. Configure environment variables:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY"
echo "   - GEMINI_API_KEY"
echo "   - GOOGLE_MAPS_API_KEY"
echo "   - TWITTER_BEARER_TOKEN (optional)"
echo "   - BLUESKY_IDENTIFIER (optional)"
echo "   - BLUESKY_PASSWORD (optional)"
echo ""
echo "6. Deploy the backend service"
echo ""
echo "7. After deployment, update your Vercel frontend environment variables:"
echo "   - REACT_APP_API_URL=https://your-backend-service.onrender.com"
echo "   - REACT_APP_WS_URL=wss://your-backend-service.onrender.com"
echo ""
echo "📚 For detailed instructions, see backend-deploy.md"
echo ""
echo "🎉 Ready for backend deployment!"