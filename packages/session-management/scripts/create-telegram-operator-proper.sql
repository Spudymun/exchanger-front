-- ============================================================================
-- CREATE TELEGRAM OPERATOR SCRIPT
-- ============================================================================
-- Создание тестового Telegram оператора с telegramId=621882329
-- ============================================================================

-- Safety check: Show current state
SELECT 
  'BEFORE CREATING TELEGRAM OPERATOR' as status,
  (SELECT COUNT(*) FROM users WHERE telegram_id IS NOT NULL) as users_with_telegram_id,
  (SELECT COUNT(*) FROM user_app_roles WHERE role = 'operator') as total_operators,
  current_database() as database_name,
  NOW() as timestamp;

-- Create Telegram operator user
INSERT INTO users (email, telegram_id, is_verified, created_at)
VALUES ('telegram-operator-621882329@system.local', '621882329', true, NOW())
ON CONFLICT (email) DO NOTHING;

-- Get the user ID for role assignment
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
        ON CONFLICT (user_id, application_context) DO NOTHING;
        
        -- Create operator role for admin application  
        INSERT INTO user_app_roles (user_id, application_context, role, created_at)
        VALUES (user_uuid, 'admin', 'operator', NOW())
        ON CONFLICT (user_id, application_context) DO NOTHING;
        
        RAISE NOTICE 'Created Telegram operator with ID: % and UUID: %', '621882329', user_uuid;
    ELSE
        RAISE EXCEPTION 'Failed to find created user with telegramId: 621882329';
    END IF;
END $$;

-- Show final state
SELECT 
  'AFTER CREATING TELEGRAM OPERATOR' as status,
  u.id,
  u.email,
  u.telegram_id,
  u.is_verified,
  u.created_at,
  array_agg(uar.application_context || ':' || uar.role) as roles
FROM users u
LEFT JOIN user_app_roles uar ON u.id = uar.user_id
WHERE u.telegram_id = '621882329'
GROUP BY u.id, u.email, u.telegram_id, u.is_verified, u.created_at;