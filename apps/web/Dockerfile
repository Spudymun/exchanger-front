# ===========================================
# Web Application - Production Dockerfile
# Next.js 15 + Turborepo Monorepo
# Follows official Turborepo Docker guide
# ===========================================

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# ===========================================
# Stage 1: Prune monorepo for web
# ===========================================
FROM base AS pruner
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

# Install turbo globally
RUN npm install -g turbo@^2

# Copy entire monorepo
COPY . .

# Generate pruned monorepo for web with --docker flag
# This creates /app/out/json (for installing deps) and /app/out/full (for building)
RUN turbo prune web --docker

# ===========================================
# Stage 2: Install dependencies
# ===========================================
FROM base AS installer
RUN apk update && apk add --no-cache libc6-compat curl
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

# Build using Turborepo
RUN npx turbo run build --filter=web...

# ===========================================
# Stage 3: Production runner
# ===========================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/package.json ./apps/web/

# Copy configuration files (already in installer stage, not needed at runtime for pre-built CSS)
# Tailwind config included for reference, PostCSS already processed during build
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/tailwind.config.cjs ./apps/web/
COPY --from=installer --chown=nextjs:nodejs /app/postcss.config.cjs ./

# Copy necessary packages (only what's needed for runtime)
COPY --from=installer --chown=nextjs:nodejs /app/packages ./packages
COPY --from=installer --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=nextjs:nodejs /app/package*.json ./

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check using our new endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Next.js
WORKDIR /app/apps/web
CMD ["../../node_modules/.bin/next", "start"]
