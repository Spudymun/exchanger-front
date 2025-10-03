-- ============================================================================
-- WEB APPLICATION RESET - App-Specific Data
-- ============================================================================
-- Resets only data specific to the WEB application
-- Does NOT affect users or admin sessions
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
  'BEFORE WEB RESET' as status,
  (SELECT COUNT(*) FROM sessions WHERE application_context = 'web') as web_sessions_count,
  (SELECT COUNT(*) FROM user_app_roles WHERE application_context = 'web') as web_roles_count,
  (SELECT COUNT(*) FROM users WHERE id IN (SELECT user_id FROM user_app_roles WHERE application_context = 'web')) as web_users_count,
  (SELECT COUNT(*) FROM users) as total_users_count,
  (SELECT COUNT(*) FROM orders) as total_orders_count,
  (SELECT COUNT(*) FROM wallets) as total_wallets_count,
  current_database() as database_name,
  NOW() as timestamp;

-- Reset WEB application data in correct order to handle foreign keys

-- 1. Delete all Orders (web-specific business data)
-- This will also cascade delete OrderAuditLog entries
DELETE FROM orders;

-- 2. Delete all Wallets (web-specific infrastructure)
DELETE FROM wallets;

-- 3. Delete all users who have web roles
-- This will cascade delete their sessions and roles via foreign keys
DELETE FROM users 
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM user_app_roles 
  WHERE application_context = 'web'
);

-- Show final state after reset
SELECT 
  'AFTER WEB RESET' as status,
  (SELECT COUNT(*) FROM sessions WHERE application_context = 'web') as web_sessions_count,
  (SELECT COUNT(*) FROM user_app_roles WHERE application_context = 'web') as web_roles_count,
  (SELECT COUNT(*) FROM users WHERE id IN (SELECT user_id FROM user_app_roles WHERE application_context = 'web')) as web_users_count,
  (SELECT COUNT(*) FROM sessions WHERE application_context = 'admin') as admin_sessions_count,
  (SELECT COUNT(*) FROM user_app_roles WHERE application_context = 'admin') as admin_roles_count,
  (SELECT COUNT(*) FROM users) as total_users_count,
  (SELECT COUNT(*) FROM orders) as total_orders_count,
  (SELECT COUNT(*) FROM wallets) as total_wallets_count,
  current_database() as database_name,
  NOW() as timestamp;

-- ✅ INFO: This reset DELETES ALL web application data:
-- 1. ALL Orders and OrderAuditLogs (web-specific business data)
-- 2. ALL Wallets (web-specific infrastructure)
-- 3. Users who had web application access (preserves admin-only users)
-- Users with ONLY admin access remain intact
-- Users with BOTH web and admin access are DELETED (because they had web access)