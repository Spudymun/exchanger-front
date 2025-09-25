-- Проверить триггеры на таблице wallets
SELECT 
  t.tgname AS trigger_name,
  t.tgenabled AS trigger_enabled,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'wallets' 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');