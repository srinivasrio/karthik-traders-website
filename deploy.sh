#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "======================================================="
echo "   Starting Karthik Traders Website VPS Deployment     "
echo "======================================================="

# Navigate to the directory where this script is located
cd "$(dirname "$0")"

echo "1. Stashing any local changes on the VPS..."
git stash || true

echo "2. Pulling the latest changes from GitHub..."
git pull origin main

echo "3. Installing npm packages..."
npm install

echo "4. Compiling production Next.js build..."
npm run build

echo "5. Restarting the PM2 application..."
if pm2 show karthik-traders > /dev/null 2>&1; then
    echo "Found PM2 process 'karthik-traders'. Restarting..."
    pm2 restart karthik-traders
    # If the website process is also running, stop/delete it to prevent port conflicts
    if pm2 show karthik-traders-website > /dev/null 2>&1; then
        echo "Stopping duplicate 'karthik-traders-website' process..."
        pm2 delete karthik-traders-website || true
    fi
elif pm2 show karthik-traders-website > /dev/null 2>&1; then
    echo "Found PM2 process 'karthik-traders-website'. Restarting..."
    pm2 restart karthik-traders-website
else
    echo "Starting a new PM2 process 'karthik-traders' using ecosystem.config.js..."
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
    else
        pm2 start npm --name "karthik-traders" -- start
    fi
fi
pm2 save

echo "======================================================="
echo "   Deployment Completed Successfully!                  "
echo "======================================================="
