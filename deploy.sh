#!/bin/bash
set -e
cd ~/b2b
git pull
cd frontend && npm run build
sudo cp -r dist/* /var/www/b2b/dist/
cd ..
pm2 restart b2b-api
echo "✓ Deploy complete"
