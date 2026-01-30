FROM rust:1.85-bookworm AS builder

WORKDIR /usr/src/app

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

COPY . .

ENV RUSTFLAGS="-C debuginfo=0"
ENV CARGO_INCREMENTAL=0

RUN cargo build --release --bin backend --verbose