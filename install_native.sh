#!/bin/bash

# =====================================================================
# Script de Instalación Nativa Profesional para HotelA
# OS: Ubuntu 24.04+ | RAM: 8GB+
# =====================================================================

# Colores para salida
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}--- Iniciando instalación nativa de HotelA ---${NC}"

# 1. Actualizar sistema y dependencias de compilación
echo -e "${GREEN}[1/7] Actualizando sistema y dependencias gráficas...${NC}"
sudo apt-get update
sudo apt-get install -y \
    pkg-config \
    libssl-dev \
    build-essential \
    postgresql \
    postgresql-contrib \
    curl \
    git \
    nginx \
    libfreetype6-dev \
    libfontconfig1-dev \
    libharfbuzz-dev \
    libpng-dev \
    clang \
    llvm \
    libclang-dev

# 2. Instalar Rust (Canal estable 2026)
echo -e "${GREEN}[2/7] Instalando Rust...${NC}"
if ! command -v cargo &> /dev/null
then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
else
    rustup update
fi

# 3. Instalar Node.js y NPM (para el Frontend)
echo -e "${GREEN}[3/7] Instalando Node.js y NPM...${NC}"
if ! command -v node &> /dev/null
then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 4. Configurar Base de Datos PostgreSQL
echo -e "${GREEN}[4/7] Configurando PostgreSQL...${NC}"
# Comprobar si el usuario ya existe, si no crearlo
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='hotela_user'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE USER hotela_user WITH PASSWORD 'hotela123';"

# Comprobar si la DB ya existe, si no crearla
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='hotela_management'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE DATABASE hotela_management OWNER hotela_user;"

# 5. Compilar Backend
echo -e "${GREEN}[5/7] Compilando Backend (esto puede tardar unos minutos)...${NC}"
cd backend
if [ ! -f .env ]; then
    cp .env.example .env
fi
# Ajustar DATABASE_URL para usar el Postgres local si es necesario
sed -i 's/localhost/127.0.0.1/g' .env
cargo build --release --bin backend

# Crear servicio de Systemd para el Backend
echo -e "${GREEN}Configurando servicio de sistema para el Backend...${NC}"
BACKEND_PATH=$(pwd)/target/release/backend
USER_NAME=$(whoami)

sudo bash -c "cat <<EOF > /etc/systemd/system/hotela-backend.service
[Unit]
Description=HotelA Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$(pwd)
ExecStart=$BACKEND_PATH
Restart=always
Environment=RUST_LOG=info

[Install]
WantedBy=multi-user.target
EOF"

sudo systemctl daemon-reload
sudo systemctl enable hotela-backend
sudo systemctl restart hotela-backend

# 6. Compilar Frontend
echo -e "${GREEN}[6/7] Compilando Frontend...${NC}"
cd ../frontend
npm install
npm run build

# 7. Configurar Nginx para servir el Frontend y Proxy al Backend
echo -e "${GREEN}[7/7] Configurando Nginx...${NC}"
FRONTEND_DIST=$(pwd)/dist

sudo bash -c "cat <<EOF > /etc/nginx/sites-available/hotela
server {
    listen 80;
    server_name _;

    root $FRONTEND_DIST;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /uploads/ {
        alias $(pwd)/../backend/uploads/;
    }
}
EOF"

sudo ln -sf /etc/nginx/sites-available/hotela /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}¡INSTALACIÓN COMPLETADA CON ÉXITO!${NC}"
echo -e "Backend: http://localhost:3000 (vía systemd)"
echo -e "Frontend: http://localhost:80 (vía Nginx)"
echo -e "====================================================${NC}"
