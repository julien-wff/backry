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

# Some packages have lots of heavy binaries (e.g. mariadb-client, mongodb-tools) that we don't need.
# Make sure their dependencies are kept, copy the binaries we need, and remove the packages.
RUN apk add --no-cache \
        # MongoDB tools \
        krb5-libs \
        mariadb-client \
        mariadb-connector-c \
        mongodb-tools \
        # MongoDB tools \
        musl \
        postgresql16-client \
        sqlite && \
    # Copy binaries \
    cp /usr/bin/mysqldump /usr/bin/mysql /usr/bin/mongodump /usr/local/bin && \
    # Uninstall packages to remove unnecessary binaries \
    apk del --no-cache \
        mariadb-client \
        mongodb-tools && \
    # Restic 0.18.0
    wget https://github.com/restic/restic/releases/download/v0.18.0/restic_0.18.0_linux_amd64.bz2 && \
    bzip2 -d restic_0.18.0_linux_amd64.bz2 && \
    mv restic_0.18.0_linux_amd64 /usr/local/bin/restic && \
    chmod +x /usr/local/bin/restic

# Install app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY drizzle.config.ts ./
COPY src/lib/server/db/schema.ts ./src/lib/server/db/schema.ts
COPY --from=builder /app/build .

# Database engines

ENV BACKRY_SQLITE_DUMP_CMD="/usr/bin/sqlite3"
ENV BACKRY_POSTGRES_DUMP_CMD="/usr/bin/pg_dump"
ENV BACKRY_MYSQL_DUMP_CMD="/usr/local/bin/mysqldump"
ENV BACKRY_MYSQL_CHECK_CMD="/usr/local/bin/mysql"
ENV BACKRY_MONGODB_DUMP_CMD="/usr/local/bin/mongodump"

# Metadata

ENV DATABASE_URL="/app/db/backry.db"
ENV NODE_ENV="production"
EXPOSE 3000
VOLUME ["/app/db"]

CMD ["sh", "-c", "bun run db:push --force && bun ."]
