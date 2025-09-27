-- ============================================================================
-- CHECK EXISTING OPERATORS SCRIPT
-- ============================================================================
-- Проверка существующих операторов в системе
-- ============================================================================

-- Show current operators status
SELECT 
  'OPERATORS STATUS' as check_type,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM user_app_roles WHERE role = 'operator') as total_operators,
  (SELECT COUNT(*) FROM user_app_roles WHERE role = 'operator' AND application_context = 'web') as web_operators,
  (SELECT COUNT(*) FROM user_app_roles WHERE role = 'operator' AND application_context = 'admin') as admin_operators,
  current_database() as database_name,
  NOW() as timestamp;

-- Show existing operators details
SELECT 
  u.id,
  u.email,
  u.created_at,
  uar.application_context,
  uar.role,
  uar.created_at as role_assigned_at
FROM users u
JOIN user_app_roles uar ON u.id = uar.user_id
WHERE uar.role = 'operator'
ORDER BY u.created_at DESC;

-- Show enum values for reference
SELECT 
  'ENUM VALUES' as info_type,
  unnest(enum_range(NULL::public."UserRole")) as available_roles;

SELECT 
  'ENUM VALUES' as info_type,
  unnest(enum_range(NULL::public."ApplicationType")) as available_application_contexts;