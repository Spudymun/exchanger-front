-- Проверить ограничения таблицы wallets
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'wallets'
  AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');