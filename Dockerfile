ARG BASE_IMAGE=oven/bun:1.2.15-alpine

FROM ${BASE_IMAGE} AS binaries

ARG RESTIC_URL=https://github.com/restic/restic/releases/download/v0.18.0/restic_0.18.0_linux_amd64.bz2
ARG SHOUTRRR_URL=https://github.com/nicholas-fedor/shoutrrr/releases/download/v0.8.13/shoutrrr_linux_amd64_0.8.13.tar.gz

WORKDIR /app

RUN apk add --no-cache \
    mariadb-client \
    mongodb-tools && \
    # Make bin folders to copy them all in "runtime" stage
    mkdir /app/bin && \
    # Copy binaries from packages
    cp /usr/bin/mysqldump /usr/bin/mysql /usr/bin/mongodump ./bin && \
    # Restic
    wget ${RESTIC_URL} -O restic.bz2 && \
    bzip2 -d restic.bz2 && \
    mv restic ./bin/restic && \
    chmod +x ./bin/restic && \
    # Shoutrrr (fork maintained by nicholas-fedor)
    wget ${SHOUTRRR_URL} -O shoutrrr.tar.gz && \
    tar -xzf shoutrrr.tar.gz && \
    mv shoutrrr/shoutrrr ./bin/shoutrrr && \
    chmod +x ./bin/shoutrrr


FROM ${BASE_IMAGE} AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile && mkdir db && touch db/backry.db

ENV DATABASE_URL="/app/db/backry.db"

COPY . .
RUN bun -c run build


FROM ${BASE_IMAGE} AS runtime

WORKDIR /app

# Install tools

# Some packages have lots of heavy binaries (e.g. mariadb-client, mongodb-tools) that we don't need.
# Make sure their dependencies are installed, then we copy the binaries from the "binaries" stage.
RUN apk add --no-cache \
        # For MongoDB tools
        krb5-libs \
        # For MariaDB client
        mariadb-connector-c \
        # For MongoDB tools
        musl \
        postgresql16-client \
        sqlite

COPY --from=binaries /app/bin /usr/local/bin/

# Copy application files

COPY drizzle.config.ts ./
COPY ./drizzle ./drizzle
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

# Healthcheck

HEALTHCHECK --interval=30s --timeout=10s --start-period=3s --retries=3 \
    CMD sh -c "wget -qO- http://$HOSTNAME:3000/api/healthcheck || exit 1"

CMD ["sh", "-c", "bun ."]
