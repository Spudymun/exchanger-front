# ===========================================
# Bull Board Dashboard - Production Dockerfile
# ===========================================

FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Copy package files
COPY apps/bull-board-dashboard/package.json ./
COPY package-lock.json ./

# Install production dependencies
RUN npm ci --omit=dev --ignore-scripts

# ===========================================
# Production runner
# ===========================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3010

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bullboard

# Copy dependencies
COPY --from=deps --chown=bullboard:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=bullboard:nodejs apps/bull-board-dashboard/server.js ./server.js

# Switch to non-root user
USER bullboard

# Expose port
EXPOSE 3010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3010/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server.js"]
