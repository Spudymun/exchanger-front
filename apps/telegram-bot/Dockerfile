# ===========================================
# Telegram Bot - Production Dockerfile
# Next.js 15 + BullMQ Worker + Turborepo
# Follows official Turborepo Docker guide
# ===========================================

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# ===========================================
# Stage 1: Prune monorepo for telegram-bot
# ===========================================
FROM base AS pruner
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

# Install turbo globally
RUN npm install -g turbo@^2

# Copy entire monorepo
COPY . .

# Generate pruned monorepo for telegram-bot AND web (needed for api-contract types)
# This creates /app/out/json (for installing deps) and /app/out/full (for building)
RUN turbo prune telegram-bot web --docker

# ===========================================
# Stage 2: Install dependencies
# ===========================================
FROM base AS installer
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

# Copy lockfile and package.json's from pruned workspace
COPY --from=pruner /app/out/json/ .

# Copy source code from pruned workspace (BEFORE npm ci)
# This ensures npm ci can properly link workspace packages
COPY --from=pruner /app/out/full/ .

# Copy root configuration files that turbo prune doesn't include
COPY --from=pruner /app/postcss.config.cjs ./

# Install dependencies (now sees full workspace structure)
RUN npm ci

# Generate Prisma Client for session-management package
RUN npx prisma generate --schema=./packages/session-management/prisma/schema.prisma

# Clean TypeScript incremental cache (tsbuildinfo) to force fresh build
RUN find packages -name "*.tsbuildinfo" -delete || true

# Build arguments for environment variables
ARG NODE_ENV=production
ARG DATABASE_URL
ARG REDIS_URL
ARG TELEGRAM_BOT_TOKEN
ARG WEB_APP_URL

ENV NODE_ENV=${NODE_ENV}
ENV DATABASE_URL=${DATABASE_URL}
ENV REDIS_URL=${REDIS_URL}
ENV TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
ENV WEB_APP_URL=${WEB_APP_URL}

# Build using Turborepo
RUN npx turbo run build --filter=telegram-bot...

# ===========================================
# Stage 3: Production runner
# ===========================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3003
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 telegrambot

# Copy built application
COPY --from=installer --chown=telegrambot:nodejs /app/apps/telegram-bot/.next ./apps/telegram-bot/.next
COPY --from=installer --chown=telegrambot:nodejs /app/apps/telegram-bot/package.json ./apps/telegram-bot/

# Copy necessary packages (only what's needed for runtime)
COPY --from=installer --chown=telegrambot:nodejs /app/packages ./packages
COPY --from=installer --chown=telegrambot:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=telegrambot:nodejs /app/package*.json ./

# Switch to non-root user
USER telegrambot

# Expose port (internal only in Docker network)
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3003/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Next.js with BullMQ Worker (via instrumentation.ts)
WORKDIR /app/apps/telegram-bot
CMD ["../../node_modules/.bin/next", "start", "--port", "3003"]
