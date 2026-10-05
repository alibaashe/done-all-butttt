#!/usr/bin/env bash
# ====================================================================
# WADAAGE MOBILITY SOMALILAND - VPS ONE-CLICK DEPLOYMENT SCRIPT
# Ubuntu 20.04 / 22.04 / 24.04 LTS & Debian 11 / 12
# Domain: wadaage.com & www.wadaage.com
# ====================================================================

set -e

echo "🚀 Starting Wadaage Mobility VPS Automated Setup..."

# 1. Update system packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx mysql-client ufw

# 2. Install Node.js 20 LTS
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "✅ Node.js Version: $(node -v)"
echo "✅ NPM Version: $(npm -v)"

# 3. Install PM2 process manager globally
sudo npm install -g pm2 tsx

# 4. Install Project Dependencies & Build Production Bundle
echo "🔨 Installing project dependencies and building client & server..."
npm install
npm run build

# 5. Configure Firewall (UFW)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 6. Start Wadaage Application via PM2
echo "⚡ Starting Wadaage Engine via PM2..."
pm2 delete wadaage-app 2>/dev/null || true
pm2 start dist/server.cjs --name "wadaage-app"
pm2 save
pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || true

# 7. Configure Nginx Reverse Proxy
echo "🌐 Configuring Nginx Reverse Proxy for Port 3000..."
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

        # Crucial for Real-Time SSE Stream & Low-Latency Radar
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

echo "🎉 Wadaage Mobility Production Engine is now running!"
echo "👉 To enable HTTPS SSL with Let's Encrypt, run:"
echo "   sudo certbot --nginx -d wadaage.com -d www.wadaage.com"
