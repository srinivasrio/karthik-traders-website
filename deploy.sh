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
if pm2 show karthik-traders-website > /dev/null 2>&1; then
    pm2 restart karthik-traders-website
else
    echo "PM2 process 'karthik-traders-website' not found. Starting a new process..."
    pm2 start npm --name "karthik-traders-website" -- start
fi

echo "======================================================="
echo "   Deployment Completed Successfully!                  "
echo "======================================================="
