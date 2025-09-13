# Database Reset Scripts

## Quick Commands

Run these from the **monorepo root**:

```bash
# Application-specific resets
npm run db:reset:web      # Reset web app data only
npm run db:reset:admin    # Reset admin app data only
npm run db:reset:all      # Reset all applications

# Database tools
npm run db:studio         # Open Prisma Studio
npm run db:generate       # Generate Prisma client
```

## Architecture

### Multi-App Database Design

- **Shared Users**: Global user accounts across apps
- **App-Specific Sessions**: Isolated by `application_context`
- **App-Specific Roles**: Users have different roles per app

### Reset Script Behavior

| Script            | Users                  | Sessions                  | Roles                  | Use Case          |
| ----------------- | ---------------------- | ------------------------- | ---------------------- | ----------------- |
| `web-reset.sql`   | ❌ Deletes web users   | ❌ Deletes web sessions   | ❌ Deletes web roles   | Web app testing   |
| `admin-reset.sql` | ❌ Deletes admin users | ❌ Deletes admin sessions | ❌ Deletes admin roles | Admin app testing |
| `full-reset.sql`  | ❌ Deletes ALL users   | ❌ Deletes ALL sessions   | ❌ Deletes ALL roles   | Complete reset    |

- Admin sessions only
- Admin application roles only
- Preserves web sessions and roles

Use when:

- Testing admin panel changes
- Admin app has data corruption
- Need to reset admin access while preserving web users

## Usage

### PowerShell Script (Recommended)

````powershell
# Web application reset only
.\reset-database.ps1 -ResetType web
## Safety Features

⚠️ **Production Protection**: All scripts automatically detect and refuse to run on production databases

🔍 **Before/After Reports**: Scripts show data counts before and after execution

📊 **Transaction Safety**: All operations run in PostgreSQL transactions

## Script Details

### `web-reset.sql`
```sql
-- Deletes users who have web application roles
-- Cascades to delete their sessions and roles
-- Preserves admin-only users
````

### `admin-reset.sql`

```sql
-- Deletes users who have admin application roles
-- Cascades to delete their sessions and roles
-- Preserves web-only users
```

### `full-reset.sql`

```sql
-- Complete database reset
-- Deletes ALL users, sessions, and roles
-- Use for fresh development start
```

## Environment Setup

Ensure your `.env` file in the monorepo root contains:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=public"
```

## Troubleshooting

**Connection Issues:**

```bash
# Test database connection
npm run db:studio
```

**Permission Issues:**

- Verify DATABASE_URL format
- Check database credentials
- Ensure PostgreSQL is running

**Production Protection Error:**

- This is intentional safety feature
- Scripts block databases with "prod" or "production" in name
