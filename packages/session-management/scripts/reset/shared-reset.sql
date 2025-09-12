-- ============================================================================
-- SHARED DATABASE RESET - Multi-App Architecture
-- ============================================================================
-- Resets core shared data that affects ALL applications
-- Should be used with caution as it impacts the entire system
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
  'BEFORE SHARED RESET' as status,
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM sessions) as sessions_count,
  (SELECT COUNT(*) FROM user_app_roles) as app_roles_count,
  current_database() as database_name,
  NOW() as timestamp;

-- Reset ALL users (affects all apps) - CASCADE will also delete sessions and roles
TRUNCATE TABLE users CASCADE;

-- Show final state after reset
SELECT 
  'AFTER SHARED RESET' as status,
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM sessions) as sessions_count,
  (SELECT COUNT(*) FROM user_app_roles) as app_roles_count,
  current_database() as database_name,
  NOW() as timestamp;

-- ⚠️  WARNING: This reset affects ALL applications!
-- After running this script, ALL users will need to re-register
-- and ALL sessions will be invalidated across web and admin apps.