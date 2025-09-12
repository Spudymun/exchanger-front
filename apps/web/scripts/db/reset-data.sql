-- ============================================================================
-- DATABASE DATA RESET - Senior Developer Solution
-- ============================================================================
-- Simple, reliable SQL commands for resetting database data
-- No custom code, just standard SQL + Prisma CLI
-- ============================================================================

-- Safety check: Prevent execution in production
DO $$
BEGIN
  IF current_setting('server_version_num')::int >= 120000 THEN
    IF current_database() LIKE '%prod%' OR current_database() LIKE '%production%' THEN
      RAISE EXCEPTION 'BLOCKED: Cannot reset data in production database: %', current_database();
    END IF;
  END IF;
END $$;

-- Show current state before reset
SELECT 
  'BEFORE RESET' as status,
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM sessions) as sessions_count,
  current_database() as database_name,
  NOW() as timestamp;

-- Reset sessions first (removes FK constraints)
TRUNCATE TABLE sessions CASCADE;

-- Reset users (this will cascade to any remaining session references)
TRUNCATE TABLE users CASCADE;

-- Show final state after reset
SELECT 
  'AFTER RESET' as status,
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM sessions) as sessions_count,
  current_database() as database_name,
  NOW() as timestamp;
