# Docker CSS Missing Issue - Final Solution

**Date**: October 20, 2025  
**Issue**: CSS styles not loading in Docker production build  
**Status**: ✅ RESOLVED

## 🔍 Problem Description

When running the application via `docker-compose`, the page loads without CSS styles, showing only basic HTML structure. The same code works correctly when running locally with `npm run dev`.

### Symptoms

- ✅ HTML renders correctly
- ✅ CSS files are generated and served
- ❌ CSS files are nearly empty (3-4 KB instead of 50-100 KB)
- ❌ Tailwind utility classes not generated
- ❌ Page displays unstyled content

## 🎯 Root Cause

**The `turbo prune web --docker` command does NOT include root-level configuration files in its output.**

Specifically:

- `postcss.config.cjs` (located at repository root)
- This file is critical for PostCSS/Tailwind CSS processing

### Why This Happened

The Docker multi-stage build uses `turbo prune web --docker` which creates:

- `/app/out/json/` - only package.json files
- `/app/out/full/` - source code needed for the `web` workspace

However, `postcss.config.cjs` at the monorepo root is **NOT included** in the pruned output because:

1. It's not referenced in any `package.json` file
2. Turbo doesn't know it's a build dependency
3. It's a root-level configuration file, not part of any workspace

### Evidence

```bash
# Locally test what turbo prune includes:
npx turbo prune web --docker --out-dir test-prune
Test-Path test-prune/out/full/postcss.config.cjs
# Result: False ❌

# In Docker installer stage - config missing:
# Without postcss.config.cjs, Next.js CSS build doesn't process Tailwind correctly
# Result: CSS files generated but only contain @layer definitions
# Missing: All Tailwind utility classes (.flex, .bg-primary, etc.)

# CSS file sizes BEFORE fix:
56 bytes, 3815 bytes, 3453 bytes (total 7,324 bytes)

# CSS file sizes AFTER fix:
48,476 bytes, 51,378 bytes, 54,380 bytes (total 154,234 bytes) ✅
```

## ✅ Solution

**Copy `postcss.config.cjs` from the pruner stage (where full monorepo exists) to installer stage BEFORE building.**

### Modified Dockerfile (`apps/web/Dockerfile`)

```dockerfile
# ===========================================
# Stage 2: Install dependencies & Build
# ===========================================
FROM base AS installer
RUN apk update && apk add --no-cache libc6-compat curl
WORKDIR /app

# Copy lockfile and package.json's from pruned workspace
COPY --from=pruner /app/out/json/ .

# Copy source code from pruned workspace (BEFORE npm ci)
COPY --from=pruner /app/out/full/ .

# ✅ FIX: Copy root configuration files that turbo prune doesn't include
COPY --from=pruner /app/postcss.config.cjs ./

# Install dependencies (now sees full workspace structure)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate --schema=./packages/session-management/prisma/schema.prisma

# Clean TypeScript cache
RUN find packages -name "*.tsbuildinfo" -delete || true

# Build using Turborepo (NOW has access to postcss.config.cjs)
RUN npx turbo run build --filter=web...

# ===========================================
# Stage 3: Production runner
# ===========================================
FROM base AS runner
WORKDIR /app

# ... standard Next.js production setup ...

# Copy built application
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/package.json ./apps/web/

# Copy configuration files (for reference, CSS already built with them)
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/tailwind.config.cjs ./apps/web/
COPY --from=installer --chown=nextjs:nodejs /app/postcss.config.cjs ./

# Copy dependencies
COPY --from=installer --chown=nextjs:nodejs /app/packages ./packages
COPY --from=installer --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=nextjs:nodejs /app/package*.json ./

# ... rest of Dockerfile ...
```

## 🚀 Implementation Steps

1. **Stop running containers**:

   ```bash
   docker-compose down
   ```

2. **Rebuild with fixed Dockerfile**:

   ```bash
   docker-compose up --build web postgres redis -d
   ```

3. **Verify fix**:

   ```bash
   # Check config files exist:
   docker exec exchanger-web ls -la /app/apps/web/tailwind.config.cjs
   docker exec exchanger-web ls -la /app/postcss.config.cjs

   # Check CSS file sizes (should be 50-100 KB each):
   docker exec exchanger-web wc -c /app/apps/web/.next/static/css/*.css
   # Expected output: ~48KB, ~51KB, ~54KB (total ~150KB)

   # Check CSS contains Tailwind utilities:
   docker exec exchanger-web grep -E '\.(flex|bg-primary|text-sm)' /app/apps/web/.next/static/css/*.css | head -5
   # Should see utility classes

   # Access application:
   # Open http://localhost:3000 in browser - should see full styling ✅
   ```

## 📊 Technical Analysis

### Build Process Flow

**Local Development (npm run dev)**:

1. Next.js finds `postcss.config.cjs` at root
2. PostCSS loads Tailwind CSS plugin
3. Tailwind reads `tailwind.config.cjs`
4. Full CSS with all utilities generated ✅

**Docker Production (BEFORE fix)**:

1. Pruner stage: turbo prune creates `/app/out/full/` ❌ (missing postcss.config.cjs)
2. Installer stage: Copies pruned files, missing postcss config
3. Build stage: Next.js cannot find PostCSS config
4. Fallback CSS generated: Only `@layer` definitions, no utilities
5. Runner stage: Serves incomplete CSS ❌

**Docker Production (AFTER fix)**:

1. Pruner stage: turbo prune + explicit `COPY /app/postcss.config.cjs` ✅
2. Installer stage: Has full config, builds correctly
3. Build stage: Next.js finds PostCSS config ✅
4. Tailwind generates all utility classes ✅
5. Runner stage: Serves complete CSS (~150 KB) ✅

### Key Files Involved

| File                                   | Location    | Purpose                          | Pruned? |
| -------------------------------------- | ----------- | -------------------------------- | ------- |
| `postcss.config.cjs`                   | Root        | PostCSS + Tailwind plugin config | ❌ NO   |
| `tailwind.config.cjs`                  | `apps/web/` | Tailwind configuration           | ✅ YES  |
| `packages/tailwind-preset/preset.js`   | Package     | Shared Tailwind preset           | ✅ YES  |
| `packages/tailwind-preset/globals.css` | Package     | CSS variables & base styles      | ✅ YES  |

### Why PostCSS Config Is Critical

Without `postcss.config.cjs`, Next.js doesn't know to:

1. Load the Tailwind CSS PostCSS plugin
2. Process `@tailwind base/components/utilities` directives
3. Generate utility classes from component usage
4. Apply autoprefixer and other PostCSS transformations

Result: CSS files are created but contain only raw CSS variables and `@layer` placeholders.

## 🎓 Lessons Learned

### 1. Turbo Prune Limitations

- `turbo prune` only copies files referenced in workspace dependencies
- Root-level config files may not be included
- Always verify pruned output contains necessary build configs

### 2. Multi-Stage Docker Builds

- Each stage only has access to explicitly copied files
- Don't assume build tools will "find" configs automatically
- Copy configs to stages that need them

### 3. CSS Framework Integration

- PostCSS/Tailwind needs runtime config even in production builds
- Missing config = incomplete CSS generation
- File size is a good indicator: ~150KB (full) vs ~7KB (broken)

## 🔧 Related Issues

If you encounter similar issues:

- Empty or small CSS files: Check config file presence
- Missing utility classes: Verify PostCSS config loaded
- Styles work locally but not in Docker: Check multi-stage build copying

## 📚 References

- [Turborepo Docker Guide](https://turbo.build/repo/docs/handbook/deploying-with-docker)
- [Next.js with Tailwind CSS](https://nextjs.org/docs/app/building-your-application/styling/tailwind-css)
- [PostCSS Configuration](https://nextjs.org/docs/app/building-your-application/configuring/post-css)

---

**Resolution**: Issue fully resolved by copying `postcss.config.cjs` from pruner stage to installer stage before build phase.
