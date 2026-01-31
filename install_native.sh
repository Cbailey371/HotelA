#!/bin/bash
set -e

# =====================================================================
# Script de Instalación Nativa Profesional para HotelA
# OS: Ubuntu 24.04+ | RAM: 8GB+
# =====================================================================

# Colores para salida
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Configuración del Usuario (EDITABLE)
DB_USER="admin_hoteladmin"
DB_PASSWORD="tupassword"
DB_NAME="dbadmin"
JWT_SECRET="clave secreta"
ALLOWED_ORIGINS="http://localhost"

echo -e "${GREEN}--- Iniciando instalación nativa de HotelA ---${NC}"

# 0. Asegurar permisos y limpieza (CRÍTICO)
echo -e "${GREEN}[0/7] Limpiando y asegurando permisos...${NC}"
# Forzar que el usuario actual sea el dueño de TODO en la carpeta del proyecto
sudo chown -R $(whoami):$(id -gn) .

# Eliminar carpetas que suelen causar errores de permisos si fueron creadas por root
sudo rm -rf backend/target frontend/node_modules frontend/dist

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
export RUSTUP_HOME="$HOME/.rustup"
export CARGO_HOME="$HOME/.cargo"

if ! command -v cargo &> /dev/null
then
    # Asegurar que el usuario tenga permisos en su propio home si se usa sudo
    sudo chown -R $(whoami):$(id -gn) "$HOME"
    
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --no-modify-path
    
    # Cargar el entorno manualmente para la sesión actual del script
    source "$HOME/.cargo/env"
else
    rustup update
fi

# Asegurar que cargo esté en el PATH para el resto del script
export PATH="$HOME/.cargo/bin:$PATH"

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
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"

# Comprobar si la DB ya existe, si no crearla
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# 5. Compilar Backend
echo -e "${GREEN}[5/7] Compilando Backend...${NC}"
cd backend

# Obtener la IP del servidor para el CORS
SERVER_IP=$(hostname -I | awk '{print $1}')

# Configurar archivo .env de forma dinámica
# Permitimos tanto localhost como la IP detectada
cat <<EOF > .env
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
JWT_SECRET="$JWT_SECRET"
ALLOWED_ORIGINS="$ALLOWED_ORIGINS,http://$SERVER_IP,http://localhost"
PORT=3000
HOST=0.0.0.0
RUST_LOG=info
EOF

cargo build --release --bin backend

# 5.1 Ejecutar Migraciones (CRÍTICO para crear tablas)
echo -e "${GREEN}[5.1/7] Ejecutando migraciones de base de datos...${NC}"
# Usamos el módulo de migración directamente para asegurar que las tablas se creen
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME" cargo run --manifest-path migration/Cargo.toml -- up

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
Environment=DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
Environment=JWT_SECRET=$JWT_SECRET
Environment=ALLOWED_ORIGINS=$ALLOWED_ORIGINS
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

# Corregir permisos de carpetas de npm para el usuario actual
sudo chown -R $(whoami) ~/.npm ~/.config 2>/dev/null || true

# Ejecutar npm install con banderas de seguridad para evitar fallos de permisos
npm install --unsafe-perm
npm run build

# 7. Configurar Nginx para servir el Frontend y Proxy al Backend
echo -e "${GREEN}[7/7] Configurando Nginx...${NC}"
FRONTEND_DIST=$(pwd)/dist

# Escribir configuración a un archivo temporal y luego moverlo con sudo
cat <<'EOF' > /tmp/hotela_nginx
server {
    listen 80;
    server_name _;

    root __FRONTEND_DIST__;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        alias __BACKEND_UPLOADS__;
    }
}
EOF

# Reemplazar los placeholders en el archivo temporal
sed -i "s|__FRONTEND_DIST__|$FRONTEND_DIST|g" /tmp/hotela_nginx
sed -i "s|__BACKEND_UPLOADS__|$(pwd)/../backend/uploads/|g" /tmp/hotela_nginx

# Mover el archivo a sitios disponibles de nginx
sudo mv /tmp/hotela_nginx /etc/nginx/sites-available/hotela
sudo ln -sf /etc/nginx/sites-available/hotela /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Obtener la IP del servidor
SERVER_IP=$(hostname -I | awk '{print $1}')
if [ -z "$SERVER_IP" ]; then
    SERVER_IP="[IP_DEL_SERVIDOR]"
fi

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}¡INSTALACIÓN COMPLETADA CON ÉXITO!${NC}"
echo -e "Acceso Web: http://$SERVER_IP"
echo -e "Backend:    http://$SERVER_IP:3000 (vía systemd)"
echo -e "====================================================${NC}"
