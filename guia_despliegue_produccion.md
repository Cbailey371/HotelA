# Guía de Despliegue en Producción - HotelA (Ubuntu 24.04)

Esta guía detalla los pasos para desplegar la aplicación HotelA en un servidor Ubuntu 24.04 con Nginx como proxy inverso, PM2 para la gestión de procesos y PostgreSQL como base de datos.

## 1. Preparación del Servidor

### Clonar el Proyecto desde GitHub
```bash
cd /var/www
sudo git clone https://github.com/Cbailey371/HotelApp.git
cd HotelApp
```

### Actualizar el sistema e instalar dependencias básicas
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx ufw
```

### Instalar PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo -i -u postgres psql -c "CREATE DATABASE hotel_db_prod;"
sudo -i -u postgres psql -c "CREATE USER hotel_user WITH PASSWORD 'tu_contraseña_segura';"
sudo -i -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE hotel_db_prod TO hotel_user;"
```

### Instalar Node.js (v22+)
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### Instalar PM2 globalmente
```bash
sudo npm install -g pm2
```

---

## 2. Despliegue del Backend (`hotel_back`)

### Configurar e Instalar
1. Navega a la carpeta: `cd hotel_back`.
2. Instala dependencias: `npm install --omit=dev`.
3. Crea el archivo `.env` basado en `.env.example`:
```env
DATABASE_URL="postgresql://hotel_user:tu_contraseña_segura@localhost:5432/hotel_db_prod?schema=public"
APP_PORT=4000
APP_URL="https://api.tuservidor.com" # Importante para los enlaces de las imágenes
# ... (otras variables de JWT)
```

### Notas sobre Almacenamiento
La aplicación ahora guarda las imágenes localmente en la carpeta `hotel_back/uploads`. Asegúrate de que esta carpeta tenga permisos de escritura si es necesario (el backend la creará automáticamente).

### Construir y Migrar
```bash
npx prisma generate
npx prisma migrate deploy
npm run build
```

### Iniciar con PM2
```bash
pm2 start dist/src/main.js --name "hotel-backend"
pm2 save
```

---

## 3. Despliegue del Frontend (`hotel_front`)

### 2. Configurar el archivo `.env.local` del Frontend
Crea el archivo `.env.local` en la carpeta `hotel_front`:
```env
ROOT_API=http://maintenpanel.hotelandros.com/api
AUTH_SECRET=un_secreto_muy_seguro_de_32_caracteres_minimo
NEXTAUTH_URL=http://maintenpanel.hotelandros.com
AUTH_TRUST_HOST=true # CRÍTICO: Necesario cuando se usa Nginx y no hay SSL
```

**Importante**: Reinicia el proceso en PM2 después de cualquier cambio en el `.env.local`:
```bash
pm2 restart hotel-frontend
```

### Construir e Iniciar
```bash
npm run build
pm2 start "npm run start" --name "hotel-frontend"
pm2 save
```

---

## 4. Configuración de Nginx (Proxy Inverso)

Crea un archivo de configuración en `/etc/nginx/sites-available/hotel`:
```nginx
server {
    listen 80;
    server_name maintenpanel.hotelandros.com;

    # 1. Login del Backend (4000) - MUY ESPECÍFICO
    # Esta ruta debe ir al backend para que el login funcione.
    location /api/auth/login {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 2. Rutas de autenticación de NextAuth -> Al Frontend (3000)
    # Incluye session, csrf, callback, etc.
    location /api/auth {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 3. El resto de la API va al Backend (4000)
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # El Frontend principal
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Habilita el sitio y reinicia Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/hotel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 5. Seguridad y SSL

### Cortafuegos (UFW)
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

### Certificado SSL con Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tuservidor.com
```

---

## 6. Mantenimiento y Logs
- Ver logs del backend: `pm2 logs hotel-backend`
- Reiniciar apps: `pm2 restart all`
- Persistir PM2 en el arranque: `pm2 startup` (sigue las instrucciones en pantalla).
