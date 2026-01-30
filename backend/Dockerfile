# Build stage - Usamos el canal nightly que soporta 2024 nativamente
FROM rustlang/rust:nightly-bookworm-slim as builder

# Instalar dependencias esenciales para compilación
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copiar archivos de configuración para pre-compilar dependencias
COPY Cargo.toml Cargo.lock ./
COPY migration/Cargo.toml ./migration/

# Copiar todo el código fuente
COPY . .

# Compilar en modo release forzando el soporte de 2024
RUN cargo build --release

# Production stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y libssl3 ca-certificates curl && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/local/bin

# Copiar el binario generado
COPY --from=builder /usr/src/app/target/release/backend ./hotel-backend

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["./hotel-backend"]
