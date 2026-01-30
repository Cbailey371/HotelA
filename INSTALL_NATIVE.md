# Guia de Instalación Nativa - HotelA
## Servidor: Ubuntu 24.04 (LTS) - Instalación sin Docker

Esta guía detalla cómo instalar el sistema directamente en el sistema operativo de tu VM dedicada.

### 1. Actualización del Sistema y Dependencias
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential pkg-config libssl-dev git curl nginx nano
```

### 2. Instalación de PostgreSQL
Instala y configura la base de datos:
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Crea el usuario y la base de datos:
```bash
sudo -u postgres psql -c "CREATE USER hotel_admin WITH PASSWORD 'tu_contrasena_segura';"
sudo -u postgres psql -c "CREATE DATABASE hotela_prod OWNER hotel_admin;"
```

### 3. Instalación de Rust (Backend)
Instala el compilador de Rust para el usuario que ejecutará la app:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

Compila el backend:
```bash
cd ~/hotela/backend
cargo build --release
```

### 4. Instalación de Node.js (Frontend)
Instala Node.js para construir el frontend:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Construye el frontend:
```bash
cd ~/hotela/frontend
npm install
npm run build
```

### 5. Configuración del Servicio (Systemd)
Crea el archivo de servicio para que el backend inicie solo: `/etc/systemd/system/hotela-backend.service`
```ini
[Unit]
Description=HotelA Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/hotela/backend
ExecStart=/home/ubuntu/hotela/backend/target/release/backend
Restart=always
Environment=DATABASE_URL=postgresql://hotel_admin:tu_contrasena_segura@localhost:5432/hotela_prod
Environment=JWT_SECRET=tu_secreto_aleatorio
Environment=ALLOWED_ORIGINS=http://localhost,http://tu_ip_privada
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Activa el servicio:
```bash
sudo systemctl daemon-reload
sudo systemctl enable hotela-backend
sudo systemctl start hotela-backend
```

### 6. Configuración de Nginx
Configura Nginx para servir el frontend y redirigir la API:
Crea `/etc/nginx/sites-available/hotela`:
```nginx
server {
    listen 80;
    server_name _; # O tu dominio interno

    # Frontend (Archivos estáticos)
    location / {
        root /home/ubuntu/hotela/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Habilita el sitio y reinicia Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/hotela /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```
