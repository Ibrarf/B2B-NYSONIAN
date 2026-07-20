#!/bin/bash
# Run this ONCE on the server after cloning the repo to /var/www/b2b
# Usage: bash /var/www/b2b/deploy/setup.sh

set -e

echo "==> Installing root dependencies..."
cd /var/www/b2b
npm install

echo "==> Installing backend dependencies..."
cd /var/www/b2b/backend
npm install

echo "==> Installing & building frontend..."
cd /var/www/b2b/frontend
npm install
npm run build

echo "==> Copying nginx config..."
sudo cp /var/www/b2b/deploy/nginx.conf /etc/nginx/sites-available/b2b
sudo ln -sf /etc/nginx/sites-available/b2b /etc/nginx/sites-enabled/b2b
sudo nginx -t
sudo systemctl reload nginx

echo "==> Starting backend with PM2..."
cd /var/www/b2b
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | sudo bash   # auto-run on reboot

echo ""
echo "==> Done! Now run: sudo certbot --nginx -d b2b.nysonik.com"
echo "==> Then visit: https://b2b.nysonik.com/api/health"
