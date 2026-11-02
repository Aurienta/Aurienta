# ───────────────────────────────────────────────────────────────
# AURIENTA — multi-stage Dockerfile
# 1. deps   — install production + dev dependencies
# 2. build  — generate Prisma client, build Next.js standalone
# 3. runtime — slim copy with healthcheck
# ───────────────────────────────────────────────────────────────

# ── Stage 1: deps ──
FROM node:20-slim AS deps
WORKDIR /app

# OpenSSL is required by Prisma on Debian slim.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Bun is used as the runtime/package manager in the sandbox; on a server we
# install just the package manager via npm globally.
RUN npm install -g bun

# Copy manifests first for layer caching.
COPY package.json bun.lock* bun.lockb* ./
COPY prisma ./prisma

# Install all deps (dev included — we need them for the build).
RUN bun install --frozen-lockfile || bun install

# ── Stage 2: build ──
FROM node:20-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g bun

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env (Next.js standalone output).
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/tmp/build.db

# Generate Prisma client + build Next.js (produces .next/standalone).
RUN bunx prisma generate
RUN bun run build

# ── Stage 3: runtime ──
FROM node:20-slim AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates wget && rm -rf /var/lib/apt/lists/*
RUN npm install -g bun

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user.
RUN useradd --system --uid 1001 nextjs
RUN mkdir -p /app/db && chown -R nextjs:nextjs /app

# Standalone server + static assets + public + Prisma client.
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nextjs /app/public ./public
COPY --from=build --chown=nextjs:nextjs /app/prisma ./prisma
COPY --from=build --chown=nextjs:nextjs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=nextjs:nextjs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

# Healthcheck — hit /api/health every 30s.  3 consecutive failures → unhealthy.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
