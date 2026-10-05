#!/usr/bin/env bash
# ====================================================================
# WADAAGE MOBILITY SOMALILAND - ONE-CLICK VPS FULL SETUP & DEPLOYMENT
# Compatible with Ubuntu 20.04 / 22.04 / 24.04 LTS & Debian 11 / 12
# ====================================================================

set -e

echo "================================================================="
echo "🚀 STARTING WADAAGE MOBILITY FULL VPS AUTOMATED SETUP..."
echo "================================================================="

# 1. Update system packages
echo "🔄 [1/7] Updating system package repositories..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx mysql-client ufw lsof

# 2. Install Node.js 20 LTS
if ! command -v node &> /dev/null; then
    echo "📦 [2/7] Installing Node.js 20 LTS runtime..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "✅ Node.js Version: $(node -v)"
echo "✅ NPM Version: $(npm -v)"

# 3. Install PM2 process manager globally
echo "📦 [3/7] Installing PM2 process manager globally..."
sudo npm install -g pm2 tsx

# 4. Install Project Dependencies & Build Production Bundle
echo "🔨 [4/7] Installing project dependencies and building production assets..."
npm install
npm run build

# 5. Configure Firewall (UFW)
echo "🛡️ [5/7] Configuring UFW Firewall rules..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 6. Start Wadaage Server via PM2
echo "⚡ [6/7] Launching Wadaage Backend Server via PM2..."
pm2 delete wadaage-app 2>/dev/null || true
pm2 start dist/server.cjs --name "wadaage-app" --env production
pm2 save
pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || true

# 7. Configure Nginx Reverse Proxy
echo "🌐 [7/7] Configuring Nginx Web Server Reverse Proxy..."
sudo rm -f /etc/nginx/sites-enabled/default

sudo tee /etc/nginx/sites-available/wadaage > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

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

        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/wadaage /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo "================================================================="
echo "🎉 WADAAGE MOBILITY FULL VPS SETUP COMPLETE!"
echo "================================================================="
echo "👉 Web application is running live at http://YOUR_VPS_IP"
echo "👉 To secure with SSL (HTTPS) for your domain, run:"
echo "   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
echo "================================================================="
