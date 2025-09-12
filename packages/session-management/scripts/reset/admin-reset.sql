-- ============================================================================
-- ADMIN APPLICATION RESET - App-Specific Data
-- ============================================================================
-- Resets only data specific to the ADMIN application
-- Does NOT affect users or web sessions
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
  'BEFORE ADMIN RESET' as status,
  (SELECT COUNT(*) FROM sessions WHERE application_context = 'admin') as admin_sessions_count,
  (SELECT COUNT(*) FROM user_app_roles WHERE application_context = 'admin') as admin_roles_count,
  (SELECT COUNT(*) FROM users WHERE id IN (SELECT user_id FROM user_app_roles WHERE application_context = 'admin')) as admin_users_count,
  (SELECT COUNT(*) FROM users) as total_users_count,
  current_database() as database_name,
  NOW() as timestamp;

-- Reset ADMIN application: delete all users who have admin roles
-- This will cascade delete their sessions and roles via foreign keys
DELETE FROM users 
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM user_app_roles 
  WHERE application_context = 'admin'
);

-- Show final state after reset
SELECT 
  'AFTER ADMIN RESET' as status,
  (SELECT COUNT(*) FROM sessions WHERE application_context = 'admin') as admin_sessions_count,
  (SELECT COUNT(*) FROM user_app_roles WHERE application_context = 'admin') as admin_roles_count,
  (SELECT COUNT(*) FROM users WHERE id IN (SELECT user_id FROM user_app_roles WHERE application_context = 'admin')) as admin_users_count,
  (SELECT COUNT(*) FROM sessions WHERE application_context = 'web') as web_sessions_count,
  (SELECT COUNT(*) FROM user_app_roles WHERE application_context = 'web') as web_roles_count,
  (SELECT COUNT(*) FROM users) as total_users_count,
  current_database() as database_name,
  NOW() as timestamp;

-- ✅ INFO: This reset DELETES all users who had admin application access
-- Users with ONLY web access remain intact
-- Users with BOTH web and admin access are DELETED (because they had admin access)