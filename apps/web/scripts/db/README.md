# Database Reset - Senior Solution

## Quick Start

```bash
# Reset all data (users + sessions)
npm run db:reset

# Open database browser
npm run db:studio
```

## What It Does

- **Truncates** `sessions` and `users` tables
- **Keeps** table structure intact
- **Shows** before/after counts
- **Blocks** production databases

## Files

- `scripts/db/reset-data.sql` - Simple SQL commands
- `package.json` - npm script using Prisma CLI

## Security

- ✅ Blocks execution on production databases
- ✅ Shows confirmation of what was reset
- ✅ No custom code = fewer bugs

## Senior Principles

1. **KISS** - Keep It Simple, Stupid
2. **Use existing tools** - Prisma CLI
3. **Standard practices** - SQL + npm scripts
4. **Safety first** - Production protection

That's it. Simple and reliable.
