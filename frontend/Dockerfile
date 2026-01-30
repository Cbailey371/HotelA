# Build stage
FROM node:20-slim as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar el build del frontend a la carpeta de nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de nginx opcional si necesitas router
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
