-- Базовая информация о таблице wallets
SELECT 
  'Total wallets' as description,
  COUNT(*) as count
FROM wallets
UNION ALL
SELECT 
  'USDT wallets' as description,
  COUNT(*) as count
FROM wallets 
WHERE currency = 'USDT'
UNION ALL
SELECT 
  'Available USDT wallets' as description,
  COUNT(*) as count
FROM wallets 
WHERE currency = 'USDT' AND status = 'available';