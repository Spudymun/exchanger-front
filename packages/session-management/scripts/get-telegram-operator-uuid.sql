-- Get Telegram operator UUID for code integration
SELECT 
  u.id as telegram_operator_uuid,
  u.email,
  uar.application_context,
  uar.role
FROM users u
JOIN user_app_roles uar ON u.id = uar.user_id
WHERE u.email = 'telegram-test-operator@system.local'
  AND uar.role = 'operator';