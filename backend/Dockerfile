# Build stage - Usamos Rust 1.85 que es la versión oficial con soporte para 2024
FROM rust:1.85-bookworm as builder

# Instalar dependencias necesarias para enlazar (OpenSSL, etc.)
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copiamos primero los archivos de dependencias para aprovechar el cache de Docker
COPY Cargo.toml Cargo.lock ./
COPY migration/Cargo.toml ./migration/

# Ahora copiamos el resto del código
COPY . .

# Configuración para reducir uso de memoria durante el enlace
ENV RUSTFLAGS="-C debuginfo=0 -C strip=symbols"
ENV CARGO_INCREMENTAL=0

# Compilamos en modo release. 
RUN cargo build --release --verbose

# Production stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/local/bin

# Copiamos el binario final
COPY --from=builder /usr/src/app/target/release/backend ./hotel-backend

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["./hotel-backend"]
