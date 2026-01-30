#!/bin/bash

# Script de instalación automática para HotelA (Nativo)
echo "--- Iniciando instalación nativa de HotelA ---"

# 1. Actualizar sistema y dependencias
sudo apt-get update
sudo apt-get install -y pkg-config libssl-dev build-essential postgresql postgresql-contrib curl

# 2. Instalar Rust si no está
if ! command -v cargo &> /dev/null
then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
fi

# 3. Configurar base de datos (Postgres)
sudo -u postgres psql -c "CREATE USER hotela_user WITH PASSWORD 'hotela123';"
sudo -u postgres psql -c "CREATE DATABASE hotela_management OWNER hotela_user;"

# 4. Preparar Backend
cd backend
cp .env.example .env
# Ajustar DATABASE_URL en .env para el Postgres local
sed -i 's/localhost/127.0.0.1/g' .env
cargo build --release

# 5. Preparar Frontend
cd ../frontend
npm install
npm run build

echo "--- Instalación completada ---"
echo "Para arrancar el backend: cd backend && ./target/release/backend"
echo "El frontend está en: frontend/dist"
