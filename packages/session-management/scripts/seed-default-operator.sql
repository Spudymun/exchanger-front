-- ============================================================================
-- DEFAULT OPERATOR SEEDING - Create Default Telegram Operator
-- ============================================================================
-- Создает дефолтного Telegram оператора с ID 621882329 для разработки
-- ============================================================================

-- Safety check: Prevent execution in production
DO $$
BEGIN
  IF current_setting('server_version_num')::int >= 120000 THEN
    IF current_database() LIKE '%prod%' OR current_database() LIKE '%production%' THEN
      RAISE EXCEPTION 'BLOCKED: Cannot seed test data in production database: %', current_database();
    END IF;
  END IF;
END $$;

-- Show current state before seeding
SELECT 
  'BEFORE DEFAULT OPERATOR SEEDING' as status,
  (SELECT COUNT(*) FROM users WHERE telegram_id IS NOT NULL) as users_with_telegram_id,
  (SELECT COUNT(*) FROM user_app_roles WHERE role = 'operator') as total_operators,
  current_database() as database_name,
  NOW() as timestamp;

-- Create default Telegram operator user
INSERT INTO users (email, telegram_id, is_verified, created_at)
VALUES ('telegram-operator-621882329@system.local', '621882329', true, NOW())
ON CONFLICT (email) DO UPDATE SET
  telegram_id = EXCLUDED.telegram_id,
  is_verified = EXCLUDED.is_verified;

-- Get the user ID and create roles
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO user_uuid FROM users WHERE telegram_id = '621882329';
    
    IF user_uuid IS NOT NULL THEN
        -- Create operator role for web application
        INSERT INTO user_app_roles (user_id, application_context, role, created_at)
        VALUES (user_uuid, 'web', 'operator', NOW())
        ON CONFLICT (user_id, application_context) DO UPDATE SET
          role = EXCLUDED.role;
        
        -- Create operator role for admin application  
        INSERT INTO user_app_roles (user_id, application_context, role, created_at)
        VALUES (user_uuid, 'admin', 'operator', NOW())
        ON CONFLICT (user_id, application_context) DO UPDATE SET
          role = EXCLUDED.role;
        
        RAISE NOTICE 'Successfully created/updated default Telegram operator with ID: % and UUID: %', '621882329', user_uuid;
    ELSE
        RAISE EXCEPTION 'Failed to find or create user with telegramId: 621882329';
    END IF;
END $$;

-- Show final state after seeding
SELECT 
  'AFTER DEFAULT OPERATOR SEEDING' as status,
  u.id as user_uuid,
  u.email,
  u.telegram_id,
  u.is_verified,
  u.created_at,
  array_agg(DISTINCT uar.application_context || ':' || uar.role) as roles
FROM users u
LEFT JOIN user_app_roles uar ON u.id = uar.user_id
WHERE u.telegram_id = '621882329'
GROUP BY u.id, u.email, u.telegram_id, u.is_verified, u.created_at;

-- Summary
SELECT 
  'SEEDING COMPLETED' as status,
  (SELECT COUNT(*) FROM users WHERE telegram_id IS NOT NULL) as total_telegram_users,
  (SELECT COUNT(*) FROM user_app_roles WHERE role = 'operator') as total_operators,
  NOW() as completed_at;