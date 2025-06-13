ARG BASE_IMAGE=oven/bun:1.2.16-alpine

FROM ${BASE_IMAGE} AS binaries

ARG TARGETARCH

ARG RESTIC_VERSION=0.18.0
ARG SHOUTRRR_VERSION=0.8.14

WORKDIR /app

RUN apk add --no-cache \
    mariadb-client \
    mongodb-tools && \
    # Make bin folders to copy them all in "runtime" stage
    mkdir /app/bin && \
    # Copy binaries from packages
    cp /usr/bin/mysqldump /usr/bin/mysql /usr/bin/mongodump ./bin && \
    # Restic \
    RESTIC_URL=https://github.com/restic/restic/releases/download/v${RESTIC_VERSION}/restic_${RESTIC_VERSION}_linux_${TARGETARCH}.bz2 && \
    wget ${RESTIC_URL} -O restic.bz2 && \
    bzip2 -d restic.bz2 && \
    mv restic ./bin/restic && \
    chmod +x ./bin/restic && \
    # Shoutrrr (fork maintained by nicholas-fedor) \
    SHOUTRRR_URL_AMD64=https://github.com/nicholas-fedor/shoutrrr/releases/download/v${SHOUTRRR_VERSION}/shoutrrr_linux_amd64_${SHOUTRRR_VERSION}.tar.gz && \
    SHOUTRRR_URL_ARM64=https://github.com/nicholas-fedor/shoutrrr/releases/download/v${SHOUTRRR_VERSION}/shoutrrr_linux_arm64v8_${SHOUTRRR_VERSION}.tar.gz && \
    SHOUTRRR_URL=$(if [ "$TARGETARCH" = "amd64" ]; then echo "$SHOUTRRR_URL_AMD64"; else echo "$SHOUTRRR_URL_ARM64"; fi) && \
    wget ${SHOUTRRR_URL} -O shoutrrr.tar.gz && \
    tar -xzf shoutrrr.tar.gz && \
    mv shoutrrr/shoutrrr ./bin/shoutrrr && \
    chmod +x ./bin/shoutrrr


FROM ${BASE_IMAGE} AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile && mkdir db && touch db/backry.db

ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

ENV PUBLIC_BUILD_DATE=${BUILD_DATE}
ENV PUBLIC_VCS_REF=${VCS_REF}
ENV PUBLIC_VERSION=${VERSION}
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

ARG BUILD_DATE
ARG VCS_REF
ARG VCS_URL
ARG VERSION

LABEL org.opencontainers.image.version=$VERSION \
      org.opencontainers.image.title="Backry" \
      org.opencontainers.image.description="An easy-to-use, fast, and efficient database backup solution based on Restic." \
      org.opencontainers.image.authors="Julien W <cefadrom1@gmail.com>" \
      org.opencontainers.image.licenses="AGPL-3.0" \
      org.opencontainers.image.url=$VCS_URL \
      org.opencontainers.image.source=$VCS_URL \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.created=$BUILD_DATE

ENV DATABASE_URL="/app/db/backry.db"
ENV NODE_ENV="production"
EXPOSE 3000
VOLUME ["/app/db"]

# Healthcheck

HEALTHCHECK --interval=30s --timeout=10s --start-period=3s --retries=3 \
    CMD sh -c "wget -qO- http://$HOSTNAME:3000/api/healthcheck || exit 1"

CMD ["sh", "-c", "bun ."]
