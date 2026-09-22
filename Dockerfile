# Wardro web app. node:20-bookworm-slim (glibc, not alpine) -- avoids the
# common `sharp` native-binding breakage on musl. Ships the full
# node_modules (rather than Next's "standalone" trace output) so the
# `prisma` CLI is guaranteed to be present for `prisma migrate deploy` at
# container start -- simplicity/reliability over image size, since this
# runs on one self-hosted box, not at scale.

FROM node:20-bookworm-slim AS base
WORKDIR /app
# Prisma's engine-selection needs the `openssl` CLI to detect the
# installed libssl version; without it, it silently guesses wrong and can
# fail to load the query engine at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
# `prisma generate` (run via postinstall below, and again explicitly in
# the builder stage) loads prisma.config.ts and eagerly resolves
# DATABASE_URL even though codegen never connects to a database -- a
# placeholder is enough at build time. docker-compose.yml overrides this
# with the real connection string at container runtime.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
RUN groupadd --gid 1001 nodejs && useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# The wardrobe-images volume mounts at /app/data -- create it with the
# right ownership up front.
RUN mkdir -p /app/data/images && chown -R nextjs:nodejs /app/data

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh && chown nextjs:nodejs /app/docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
