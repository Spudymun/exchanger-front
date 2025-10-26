-- Get Telegram operator UUID for code integration
-- Updated: uses telegram_id instead of deprecated email
SELECT 
  u.id as telegram_operator_uuid,
  u.email,
  u.telegram_id,
  uar.application_context,
  uar.role
FROM users u
JOIN user_app_roles uar ON u.id = uar.user_id
WHERE u.telegram_id = '621882329'
  AND uar.role = 'operator';