#!/bin/bash
set -e

DOMAIN="omnipim.poridheo.shop"
REMOTE_BACKEND="server.poridheo.shop"

echo "📂 Step 1: Cleaning up and Preparing Directory..."
# Remove old failed attempts to start fresh
rm -rf OMNIMDM_TEMP
mkdir -p OMNIMDM_TEMP

echo "🛰️ Cloning repository..."
git clone https://github.com/urbancraf/OMNIMDM.git OMNIMDM

# Move into the folder where the code actually is
cd OMNIMDM

# Stop any running containers
docker compose down || true

echo "📂 Step 2: Creating required sub-directories..."
mkdir -p ssl
mkdir -p nginx/conf.d

echo "🐳 Step 3: Creating Dockerfile.frontend..."
# We use a slightly modified Dockerfile to ensure it finds the package.json
cat <<EOF > Dockerfile.frontend
FROM node:18-alpine
WORKDIR /app
# We copy everything first to ensure package.json is present
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
EOF

echo "🛠️ Step 4: Patching vite.config.js..."
cat <<EOF > vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['$DOMAIN'],
    strictPort: true
  }
});
EOF

echo "📝 Step 5: Setting up .env..."
cat <<EOF > .env
VITE_API_BASE_URL=https://$DOMAIN/api
EOF

echo "🔐 Step 6: Generating SSL certificates..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/privkey.pem -out ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=OmniPIM/OU=Dev/CN=$DOMAIN"

echo "⚙️ Step 7: Creating Nginx configuration..."
cat <<EOF > nginx/conf.d/default.conf
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }

    location /api/ {
        proxy_pass http://$REMOTE_BACKEND:3000/; 
        proxy_set_header Host $REMOTE_BACKEND;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

echo "🐳 Step 8: Creating docker-compose.yml..."
cat <<EOF > docker-compose.yml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: omnipim_frontend
    volumes:
      - .:/app
      - /app/node_modules

  nginx:
    image: nginx:stable-alpine
    container_name: omnipim_proxy
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./ssl:/etc/nginx/ssl
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
EOF

echo "🏗️ Step 9: Building and Starting Services..."
docker compose up -d --build

echo "---"
echo "✅ Setup Complete!"
echo "🌐 Access your site at: https://$DOMAIN"
docker ps