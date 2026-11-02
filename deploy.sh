#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "======================================================="
echo "   Starting Karthik Traders Website VPS Deployment     "
echo "======================================================="

# Navigate to the directory where this script is located
cd "$(dirname "$0")"

echo "0. Checking system RAM & Swap..."
SWAP_TOTAL=$(free -m 2>/dev/null | awk '/Swap:/ {print $2}' || echo 0)
if [ -z "$SWAP_TOTAL" ] || [ "$SWAP_TOTAL" -lt 512 ]; then
    echo "⚠️ Swap memory is low or missing (${SWAP_TOTAL:-0} MB). Checking /swapfile..."
    if [ ! -f /swapfile ] && [ "$(id -u)" -eq 0 ]; then
        echo "Allocating 2GB swap space to guarantee fast Next.js compilation..."
        fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile || true
        echo '/swapfile none swap sw 0 0' >> /etc/fstab || true
        echo "✅ 2GB Swap activated."
    elif [ -f /swapfile ] && [ "$(id -u)" -eq 0 ]; then
        swapon /swapfile 2>/dev/null || true
    fi
fi

echo "1. Stashing any local changes on the VPS..."
git stash || true

echo "2. Pulling the latest changes from GitHub..."
git pull origin main

echo "3. Installing npm packages..."
npm install --omit=optional --prefer-offline || npm install

# Guarantee Linux SWC binary exists so Next.js doesn't freeze attempting background downloads
if [ "$(uname)" = "Linux" ]; then
    echo "Ensuring Linux SWC binary exists..."
    npm install --no-save @next/swc-linux-x64-gnu@16.1.4 2>/dev/null || true
fi

echo "4. Compiling production Next.js build..."
export NODE_OPTIONS="--max-old-space-size=2048"
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
