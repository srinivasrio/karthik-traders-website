#!/bin/bash

# Deployment Script for Karthik Traders Website
# Usage: ./deploy.sh

echo "🚀 Starting Deployment..."

# 1. Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Build the application
echo "🏗️ Building Next.js app..."
npm run build

# 4. Restart PM2 process
echo "🔄 Restarting application..."
if command -v pm2 &> /dev/null; then
    pm2 restart karthik-traders || pm2 start ecosystem.config.js
    pm2 save
else
    echo "⚠️ PM2 not found. Installing global PM2..."
    npm install -g pm2
    pm2 start ecosystem.config.js
    pm2 save
fi

echo "✅ Deployment Complete! App is running on port 3000."
