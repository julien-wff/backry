FROM oven/bun:1.2-alpine

# Install tools

RUN apk add --no-cache \
    postgresql16-client \
    sqlite && \
    # Restic 0.18.0
    wget https://github.com/restic/restic/releases/download/v0.18.0/restic_0.18.0_linux_amd64.bz2 && \
    bzip2 -d restic_0.18.0_linux_amd64.bz2 && \
    mv restic_0.18.0_linux_amd64 /usr/local/bin/restic && \
    chmod +x /usr/local/bin/restic

# Build app

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile && mkdir db && touch db/backry.db

ENV DATABASE_URL="/app/db/backry.db"

COPY . .
RUN bun -c run build

# Metadata

EXPOSE 3000
VOLUME ["/app/db"]

CMD ["sh", "-c", "bun run db:push --force && bun ./build"]
