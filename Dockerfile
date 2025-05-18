FROM oven/bun:1.2.13-alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile && mkdir db && touch db/backry.db

ENV DATABASE_URL="/app/db/backry.db"

COPY . .
RUN bun -c run build


FROM oven/bun:1.2.13-alpine AS runtime

WORKDIR /app

# Install tools

RUN apk add --no-cache \
    mariadb-client \
    mariadb-connector-c \
    postgresql16-client \
    sqlite && \
    # Restic 0.18.0
    wget https://github.com/restic/restic/releases/download/v0.18.0/restic_0.18.0_linux_amd64.bz2 && \
    bzip2 -d restic_0.18.0_linux_amd64.bz2 && \
    mv restic_0.18.0_linux_amd64 /usr/local/bin/restic && \
    chmod +x /usr/local/bin/restic

# Install app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY drizzle.config.ts ./
COPY ./src/lib/db/schema.ts ./src/lib/db/schema.ts
COPY --from=builder /app/build .

# Database engines

ENV BACKRY_SQLITE_DUMP_CMD="/usr/bin/sqlite3"
ENV BACKRY_POSTGRES_DUMP_CMD="/usr/bin/pg_dump"
ENV BACKRY_MYSQL_DUMP_CMD="/usr/bin/mysqldump"
ENV BACKRY_MYSQL_CHECK_CMD="/usr/bin/mysql"

# Metadata

ENV DATABASE_URL="/app/db/backry.db"
ENV NODE_ENV="production"
EXPOSE 3000
VOLUME ["/app/db"]

CMD ["sh", "-c", "bun run db:push --force && bun ."]
