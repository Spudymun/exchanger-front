-- Проверить существующие данные в таблице wallets
SELECT 
  id,
  address,
  currency,
  token_standard,
  status,
  label,
  notes,
  total_orders,
  last_used_at,
  created_at,
  updated_at,
  disabled_at
FROM wallets 
LIMIT 10;