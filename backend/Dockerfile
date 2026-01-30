# Build stage
# Build stage
FROM rust:1.85-slim as builder

WORKDIR /usr/src/app
COPY . .

# Instalar dependencias necesarias para la compilación (si las hay)
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

RUN cargo build --release

# Production stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/local/bin

COPY --from=builder /usr/src/app/target/release/backend ./hotel-backend
# COPY migrations ./migrations # Si decides correr migraciones manualmente o vía código

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["./hotel-backend"]
