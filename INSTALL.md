# Guía de Instalación y Despliegue - HotelA
## Servidor: Ubuntu 24.04 (LTS)

Esta guía detalla el proceso para subir el proyecto a producción utilizando Docker para la orquestación y Nginx como Proxy Inverso.

### 1. Preparación del Servidor
Actualice el sistema e instale las dependencias base:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git apt-transport-https ca-certificates software-properties-common
```

### 2. Instalación de Docker y Docker Compose
Instale el motor de Docker según la documentación oficial de Ubuntu:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 3. Clonar y Configurar el Proyecto
```bash
git clone <URL_DEL_REPOSITORIO> hotela
cd hotela
```

Cree un archivo `.env` en la raíz con las credenciales de producción:
```env
DB_USER=hotel_admin
DB_PASSWORD=una_contraseña_segura
DB_NAME=hotela_prod
JWT_SECRET=genera_un_secreto_largo_y_aleatorio
ALLOWED_ORIGINS=https://tu-dominio.com
```

### 4. Despliegue con Docker Compose
Construya e inicie los contenedores en segundo plano:
```bash
docker compose up -d --build
```

### 5. Configuración de Nginx (Proxy Inverso)
Instale Nginx y configure el sitio:
```bash
sudo apt install -y nginx
```

Cree el archivo `/etc/nginx/sites-available/hotela`:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:80; # Puerto del contenedor frontend
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000; # Puerto del contenedor backend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
Habilite el sitio y reinicie Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/hotela /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Seguridad Adicional (SSL con Certbot)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

---
**Nota**: Asegúrese de que los puertos 80 y 443 estén abiertos en su firewall (UFW).
