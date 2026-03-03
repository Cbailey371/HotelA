# HotelA - Sistema de Gestión de Inventario y Mantenimiento

Este proyecto es una aplicación web híbrida (Rust/React) diseñada para ejecutarse de forma nativa en tu entorno local o servidor.

## Requisitos Previos

- **Node.js**: Versión 20.x o superior
- **Rust**: Última versión estable (`rustup`)
- **PostgreSQL**: Versión 15 o superior

## Configuración y Ejecución Local

### 1. Base de Datos (PostgreSQL)

Crea una base de datos local para el proyecto:

```sql
CREATE DATABASE hotela_db;
CREATE USER cbailey WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE hotela_db TO cbailey;
```

### 2. Backend (Rust)

El backend utiliza el framework Axum y SeaORM.

1. Navega a la carpeta del backend:
   ```bash
   cd backend
   ```

2. Configura las variables de entorno editando el archivo `.env` o créalo si no existe:
   ```env
   DATABASE_URL=postgres://cbailey:tu_password@localhost/hotela_db
   RUST_LOG=debug
   HOST=127.0.0.1
   PORT=3000
   JWT_SECRET=super_secret_production_key_change_me_in_prod_12345
   ALLOWED_ORIGINS=http://localhost:5173
   ```

3. Ejecuta las migraciones de la base de datos:
   ```bash
   cargo run --manifest-path migration/Cargo.toml -- up
   ```

4. Inicia el servidor de desarrollo:
   ```bash
   cargo run
   ```
   El backend estará disponible en `http://localhost:3000`.

### 3. Frontend (React/Vite)

El frontend utiliza React, Material UI y Vite.

1. En una nueva terminal, navega a la carpeta del frontend:
   ```bash
   cd frontend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura el archivo `.env` en la carpeta frontend:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

4. Inicia el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
   La aplicación web estará disponible en `http://localhost:5173`.
