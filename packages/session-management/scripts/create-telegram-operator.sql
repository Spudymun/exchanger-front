-- ============================================================================
-- CREATE TELEGRAM OPERATOR SCRIPT
-- ============================================================================
-- Создание тестового Telegram оператора для решения UUID проблемы
-- Основано на архитектуре проекта: User + UserAppRole для OPERATOR роли
-- ============================================================================

-- Safety check: Prevent execution in wrong database
DO $$
BEGIN
  IF current_database() NOT LIKE '%exchanger%' THEN
    RAISE EXCEPTION 'BLOCKED: Wrong database. Expected exchanger database, got: %', current_database();
  END IF;
END $$;

-- Show current state before creation
SELECT 
  'BEFORE_CREATION' as status,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM user_app_roles WHERE role = 'operator') as total_operators,
  current_database() as database_name,
  NOW() as timestamp;

-- ============================================================================
-- STEP 1: Create Telegram test operator user
-- ============================================================================

-- Insert test Telegram operator (will auto-generate UUID)
INSERT INTO users (email, is_verified, created_at)
SELECT 
  'telegram-test-operator@system.local' as email,
  true as is_verified,
  NOW() as created_at
WHERE NOT EXISTS (
  -- Avoid duplicates
  SELECT 1 FROM users 
  WHERE email = 'telegram-test-operator@system.local'
);

-- Get the UUID of created user for next step
-- ============================================================================
-- STEP 2: Assign OPERATOR role for WEB application context
-- ============================================================================

INSERT INTO user_app_roles (user_id, application_context, role, created_at)
SELECT 
  u.id as user_id,
  'web' as application_context,
  'operator' as role,
  NOW() as created_at
FROM users u
WHERE u.email = 'telegram-test-operator@system.local'
  AND NOT EXISTS (
    -- Avoid duplicate roles
    SELECT 1 FROM user_app_roles uar 
    WHERE uar.user_id = u.id 
      AND uar.application_context = 'web' 
      AND uar.role = 'operator'
  );

-- ============================================================================
-- VERIFICATION: Show created operator details
-- ============================================================================

-- Show the created Telegram operator with UUID
SELECT 
  'TELEGRAM_OPERATOR_CREATED' as result_type,
  u.id as operator_uuid,
  u.email,
  u.is_verified,
  u.created_at,
  uar.application_context,
  uar.role,
  uar.created_at as role_assigned_at
FROM users u
JOIN user_app_roles uar ON u.id = uar.user_id
WHERE u.email = 'telegram-test-operator@system.local'
  AND uar.role = 'operator';

-- Show summary after creation
SELECT 
  'AFTER_CREATION' as status,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM user_app_roles WHERE role = 'operator') as total_operators,
  (SELECT COUNT(*) FROM users WHERE email LIKE 'telegram-%@system.local') as telegram_operators,
  current_database() as database_name,
  NOW() as timestamp;