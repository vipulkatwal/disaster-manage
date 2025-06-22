#!/bin/bash

# Geo Aid Deployment Script
# This script helps prepare the project for deployment on Render

echo "🚀 Geo Aid Deployment Script"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Found render.yaml configuration"

# Check if backend package.json exists
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: backend/package.json not found"
    exit 1
fi

# Check if frontend package.json exists
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: frontend/package.json not found"
    exit 1
fi

echo "✅ Found both backend and frontend package.json files"

# Check for environment example files
if [ ! -f "backend/env.example" ]; then
    echo "⚠️  Warning: backend/env.example not found"
else
    echo "✅ Found backend environment example"
fi

echo ""
echo "📋 Deployment Checklist:"
echo "========================"
echo "1. ✅ render.yaml configuration ready"
echo "2. ✅ Backend package.json exists"
echo "3. ✅ Frontend package.json exists"
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
echo "6. Deploy both services"
echo ""
echo "📚 For detailed instructions, see DEPLOYMENT.md"
echo ""
echo "🎉 Ready for deployment!"