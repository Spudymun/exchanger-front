# Database Reset Scripts - Multi-App Architecture

## Overview

This directory contains database reset scripts designed for a multi-application architecture where multiple apps (web, admin) share the same database but have isolated sessions and roles.

## Architecture

Our system has:

- **Shared Users**: Users exist globally across all applications
- **App-Specific Sessions**: Each app maintains its own session namespace (`session:web:*`, `session:admin:*`)
- **App-Specific Roles**: Users can have different roles in different applications via `UserAppRole` table

## Reset Types

### 🚨 Shared Reset (`shared-reset.sql`)

**⚠️ DANGER: Affects ALL applications**

Resets:

- All users
- All sessions (web + admin)
- All application roles

Use when:

- Complete system reset needed
- Switching between major development phases
- Cleaning up after major schema changes

### 🌐 Web-Only Reset (`web-reset.sql`)

Resets only WEB application data:

- Web sessions only
- Web application roles only
- Preserves admin sessions and roles

Use when:

- Testing web application changes
- Web app has data corruption
- Need to reset web users while preserving admin access

### 🔧 Admin-Only Reset (`admin-reset.sql`)

Resets only ADMIN application data:

- Admin sessions only
- Admin application roles only
- Preserves web sessions and roles

Use when:

- Testing admin panel changes
- Admin app has data corruption
- Need to reset admin access while preserving web users

## Usage

### PowerShell Script (Recommended)

```powershell
# Web application reset only
.\reset-database.ps1 -ResetType web

# Admin application reset only
.\reset-database.ps1 -ResetType admin

# Complete system reset (ALL apps)
.\reset-database.ps1 -ResetType shared -Force

# Dry run to see what would happen
.\reset-database.ps1 -ResetType web -DryRun

# Use custom database URL
.\reset-database.ps1 -ResetType web -DatabaseUrl "postgresql://user:pass@localhost:5432/mydb"
```

### Direct SQL Execution

```bash
# Ensure you have psql installed and DATABASE_URL set
psql $DATABASE_URL -f packages/session-management/scripts/reset/web-reset.sql
```

## Safety Features

1. **Production Protection**: Scripts refuse to run on databases with "prod" or "production" in the name
2. **Confirmation Prompts**: PowerShell script asks for confirmation unless `-Force` is used
3. **Before/After Reports**: All scripts show data counts before and after reset
4. **Dry Run Mode**: Test what would happen without making changes

## File Structure

```
packages/session-management/scripts/
├── reset-database.ps1          # Main management script
├── reset/
│   ├── shared-reset.sql        # Complete system reset
│   ├── web-reset.sql          # Web app only reset
│   └── admin-reset.sql        # Admin app only reset
└── README.md                  # This file
```

## Migration from Old Reset Script

The old script at `apps/web/scripts/db/reset-data.sql` has been **deprecated** because:

1. **Architectural Problem**: A web app script shouldn't delete ALL users (affects admin app)
2. **No Isolation**: Didn't respect multi-app session management
3. **Too Broad**: Always did full system reset even for app-specific needs

### Migration Steps:

1. **Replace old calls** to `apps/web/scripts/db/reset-data.sql`
2. **Use new scripts** based on your needs:
   - Need to reset everything? → `shared-reset.sql`
   - Need to reset only web app? → `web-reset.sql`
   - Need to reset only admin app? → `admin-reset.sql`

### Example Migration:

```bash
# OLD (deprecated)
psql $DATABASE_URL -f apps/web/scripts/db/reset-data.sql

# NEW (app-specific)
.\packages\session-management\scripts\reset-database.ps1 -ResetType web

# NEW (if you really need full reset)
.\packages\session-management\scripts\reset-database.ps1 -ResetType shared -Force
```

## Database Schema Impact

These scripts work with the new multi-app schema:

```sql
-- Users table (shared across apps)
users (id, email, hashed_password, role, ...)

-- App-specific sessions
sessions (id, user_id, application_context, ...)

-- App-specific roles
user_app_roles (id, user_id, application_context, role, ...)
```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (required)
- Scripts automatically detect production environments and refuse to run

## Error Handling

- Scripts use PostgreSQL transactions and proper error handling
- PowerShell script provides clear success/failure feedback
- All operations are logged with timestamps

## Best Practices

1. **Always use dry-run first** when testing new reset scenarios
2. **Prefer app-specific resets** over shared resets when possible
3. **Backup production data** before any reset (even though scripts block production)
4. **Use version control** to track when and why resets were performed
5. **Document reset reasons** in your development workflow

## Troubleshooting

### Common Issues:

1. **"psql command not found"**
   - Install PostgreSQL client tools
   - Ensure psql is in your PATH

2. **"Permission denied"**
   - Check DATABASE_URL format
   - Verify database credentials

3. **"Production database detected"**
   - This is intentional protection
   - Use `-Force` only if absolutely necessary
   - Double-check you're targeting the right database

### Debug Commands:

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT current_database(), current_user;"

# Check current data counts
psql $DATABASE_URL -c "
  SELECT
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM sessions) as sessions,
    (SELECT COUNT(*) FROM user_app_roles) as app_roles;
"
```
