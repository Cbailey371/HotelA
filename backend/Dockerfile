# =========================
# Build stage
# =========================
FROM rust:1.93-bookworm AS builder

WORKDIR /usr/src/app

# Dependencias del sistema (CRÍTICAS) - Necesarias para compilar librerías de PDF, seguridad y bindgen
RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    libssl-dev \
    ca-certificates \
    clang \
    llvm \
    libclang-dev \
    libfreetype6-dev \
    libfontconfig1-dev \
    libharfbuzz-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiamos el código fuente
COPY . .

# Optimizaciones de Memoria (Evita el Error 101 al reducir la carga del enlazador)
ENV RUSTFLAGS="-C debuginfo=0"
ENV CARGO_INCREMENTAL=0

# Compilación en modo release con logs detallados. Usamos la versión de Rust 1.93 (Jan 2026)
RUN cargo build --release --bin backend --verbose

# =========================
# Runtime stage
# =========================
FROM debian:bookworm-slim

WORKDIR /usr/local/bin

# Librerías de ejecución necesarias para el binario final
RUN apt-get update && apt-get install -y \
    libssl3 \
    ca-certificates \
    libfreetype6 \
    libfontconfig1 \
    libharfbuzz0b \
    libpng16-16 \
    && rm -rf /var/lib/apt/lists/*

# Copiamos el binario compilado desde la etapa anterior
COPY --from=builder /usr/src/app/target/release/backend ./hotel-backend

# Configuración de ejecución
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["./hotel-backend"]