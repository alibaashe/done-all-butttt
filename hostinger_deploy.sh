#!/bin/bash
# ==============================================================================
# WADAAGE MOBILITY - HOSTINGER VPS / UBUNTU / DEBIAN AUTOMATED DEPLOYMENT SCRIPT
# Connects: Hostinger Node.js Backend + MySQL Database + Rider APK + Driver APK
# ==============================================================================

set -e

echo "🚀 [1/6] Starting Wadaage Mobility Deployment on Hostinger..."

# Update package lists and install Node.js 20 & PM2 if missing
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
    echo "⚡ Installing PM2 Process Manager globally..."
    sudo npm install -g pm2
fi

echo "📦 [2/6] Installing project dependencies..."
npm install --production=false

echo "🔨 [3/6] Building Production Bundle (Vite Frontend + Node.js CommonJS Backend)..."
npm run build

echo "🗄️ [4/6] Checking Environment Variables (.env)..."
if [ ! -f .env ]; then
    echo "Creating default .env from .env.example..."
    cp .env.example .env || true
fi

echo "🚀 [5/6] Starting Wadaage Node.js Application with PM2..."
pm2 delete wadaage-mobility || true
pm2 start ecosystem.config.cjs --env production
pm2 save

echo "🔒 [6/6] Ensuring PM2 restarts automatically on server reboot..."
pm2 startup || true

echo "=============================================================================="
echo "✅ WADAAGE MOBILITY SUCCESSFULLY DEPLOYED ON HOSTINGER!"
echo "🌐 Node.js Gateway listening on Port 3000 (http://127.0.0.1:3000)"
echo "📲 Both Rider and Driver APKs can now connect to your domain or VPS IP!"
echo "=============================================================================="
