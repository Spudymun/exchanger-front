-- ============================================================================
-- USER APP ROLES MIGRATION SCRIPT
-- ============================================================================
-- Миграция существующих ролей из users.role в user_app_roles таблицу
-- Предположение: все существующие пользователи относятся к WEB приложению
-- ============================================================================

-- Safety check: Prevent execution in production
DO $$
BEGIN
  IF current_setting('server_version_num')::int >= 120000 THEN
    IF current_database() LIKE '%prod%' OR current_database() LIKE '%production%' THEN
      RAISE EXCEPTION 'BLOCKED: Cannot run migration in production database: %', current_database();
    END IF;
  END IF;
END $$;

-- Show current state before migration
SELECT 
  'BEFORE MIGRATION' as status,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM users WHERE role = 'user') as user_role_count,
  (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_role_count,
  (SELECT COUNT(*) FROM users WHERE role = 'operator') as operator_role_count,
  (SELECT COUNT(*) FROM users WHERE role = 'support') as support_role_count,
  (SELECT COUNT(*) FROM user_app_roles) as existing_app_roles,
  NOW() as timestamp;

-- ============================================================================
-- MIGRATION: Создаем записи в user_app_roles для всех существующих пользователей
-- ============================================================================

-- Миграция пользователей в WEB приложение с их текущими ролями
INSERT INTO user_app_roles (user_id, application_context, role, created_at)
SELECT 
  u.id as user_id,
  'web' as application_context,
  u.role as role,
  u.created_at as created_at
FROM users u
WHERE NOT EXISTS (
  -- Избегаем дублирования если миграция уже запущена
  SELECT 1 FROM user_app_roles uar 
  WHERE uar.user_id = u.id AND uar.application_context = 'web'
);

-- Show migration results
SELECT 
  'AFTER MIGRATION' as status,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM user_app_roles) as total_app_roles,
  (SELECT COUNT(*) FROM user_app_roles WHERE application_context = 'web') as web_app_roles,
  (SELECT COUNT(*) FROM user_app_roles WHERE application_context = 'admin') as admin_app_roles,
  (SELECT COUNT(*) FROM user_app_roles WHERE role = 'user') as user_roles,
  (SELECT COUNT(*) FROM user_app_roles WHERE role = 'admin') as admin_roles,
  (SELECT COUNT(*) FROM user_app_roles WHERE role = 'operator') as operator_roles,
  (SELECT COUNT(*) FROM user_app_roles WHERE role = 'support') as support_roles,
  NOW() as timestamp;

-- ============================================================================
-- VALIDATION: Проверка корректности миграции
-- ============================================================================

-- Проверяем что у каждого пользователя есть роль в приложении
SELECT 
  'VALIDATION' as check_type,
  'Users without app roles' as check_name,
  COUNT(*) as count
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_app_roles uar WHERE uar.user_id = u.id
);

-- Проверяем соответствие ролей
SELECT 
  'VALIDATION' as check_type,
  'Role mismatch count' as check_name,
  COUNT(*) as count
FROM users u
JOIN user_app_roles uar ON u.id = uar.user_id
WHERE u.role != uar.role AND uar.application_context = 'web';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'SUCCESS: Migration completed!' as message;
SELECT 'Next step: Update application code to use user_app_roles instead of users.role' as next_action;