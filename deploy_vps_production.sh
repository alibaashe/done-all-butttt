#!/usr/bin/env bash
# ====================================================================
# WADAAGE MOBILITY SOMALILAND - ONE-CLICK VPS PRODUCTION DEPLOYMENT
# Designed to run inside: /var/www/wadaage
# Works on Ubuntu 20.04 / 22.04 / 24.04 LTS & Debian 11 / 12
# Domain: wadaage.com & www.wadaage.com
# ====================================================================

set -e

APP_DIR="/var/www/wadaage"

echo "===================================================================="
echo "🚀 Starting Wadaage Mobility Production Setup in ${APP_DIR}..."
echo "===================================================================="

# Ensure script is executed inside /var/www/wadaage or navigate there
if [ -d "${APP_DIR}" ]; then
    cd "${APP_DIR}"
fi

# 1. Update system packages and install essential utilities
echo "📦 [1/7] Updating system packages and installing prerequisites..."
sudo apt update -y
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx mysql-client ufw

# 2. Install Node.js 20 LTS if not present
if ! command -v node &> /dev/null; then
    echo "📦 [2/7] Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "  - Node.js Version: $(node -v)"
echo "  - NPM Version: $(npm -v)"

# 3. Install PM2 and tsx process managers globally
echo "⚡ [3/7] Installing PM2 and tsx process managers globally..."
sudo npm install -g pm2 tsx esbuild

# 4. Environment File Configuration (.env)
echo "🔒 [4/7] Verifying environment configuration (.env)..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        echo "⚠️ Please edit .env with your actual secret API keys and database credentials before proceeding!"
    else
        echo "❌ Error: Neither .env nor .env.example exists."
        exit 1
    fi
fi

# 5. Install Project Dependencies & Build Production Bundle
echo "🔨 [5/7] Installing npm packages and compiling Wadaage full-stack bundle..."
npm install --production=false
npm run build

# 6. Configure Nginx Reverse Proxy
echo "🌐 [6/7] Configuring Nginx Reverse Proxy for Port 3000..."
sudo rm -f /etc/nginx/sites-enabled/default

sudo tee /etc/nginx/sites-available/wadaage > /dev/null << 'EOF'
server {
    listen 80;
    server_name wadaage.com www.wadaage.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Real-Time Live Radar SSE Streaming Config
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/wadaage /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 7. Start / Restart PM2 Engine
echo "🚀 [7/7] Starting Wadaage Engine via PM2..."
pm2 delete wadaage-mobility wadaage-production wadaage-app 2>/dev/null || true
pm2 start ecosystem.config.cjs --env production
pm2 save
sudo pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || true

echo "===================================================================="
echo "🎉 WADAAGE MOBILITY DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "📍 Directory: /var/www/wadaage"
echo "🌐 Server Proxy: http://127.0.0.1:3000 -> https://www.wadaage.com"
echo "👉 Manage Process with PM2:"
echo "   pm2 restart wadaage-mobility"
echo "   pm2 logs wadaage-mobility"
echo "===================================================================="
