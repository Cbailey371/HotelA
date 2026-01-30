# Build stage
FROM rust:1.85-slim as builder

# Instalar dependencias necesarias para la compilación (SSL y herramientas de enlace)
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Optimizamos el caché de dependencias
COPY Cargo.toml Cargo.lock ./
COPY migration/Cargo.toml ./migration/
# Creamos archivos dummy para que cargo pueda descargar dependencias antes de copiar el código
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN mkdir -p migration/src && echo "pub fn test() {}" > migration/src/lib.rs
RUN cargo fetch

# Copiar el código fuente real
COPY . .

# Compilar en modo release con un solo hilo (-j 1)
# Esto evita que el compilador consuma demasiada RAM y cause el error 101 (panic) en la VM
RUN cargo build --release -j 1

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
