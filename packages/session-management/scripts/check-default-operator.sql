-- Проверка созданного дефолтного оператора
SELECT 
  'DEFAULT OPERATOR CHECK' as status,
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