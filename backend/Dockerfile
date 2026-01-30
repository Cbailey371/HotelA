# Build stage
FROM rust:1.84-slim as builder

# Instalar dependencias esenciales
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copiamos todo de una vez para evitar conflictos de workspace/ediciones
COPY . .

# Compilar en modo release (simplificado para evitar Error 101)
RUN cargo build --release

# Production stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/local/bin

# Copiar el binario generado
COPY --from=builder /usr/src/app/target/release/backend ./hotel-backend

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["./hotel-backend"]
