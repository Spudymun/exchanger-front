-- Сбросить все USDT кошельки в статус AVAILABLE для тестирования умной очереди
-- Используется для перезапуска с чистыми доступными кошельками

-- Safety check
DO $$
BEGIN
  IF current_database() LIKE '%prod%' OR current_database() LIKE '%production%' THEN
    RAISE EXCEPTION 'BLOCKED: Cannot reset wallet statuses in production database: %', current_database();
  END IF;
END $$;

-- Show current state
SELECT 
  'BEFORE RESET' as status,
  status,
  COUNT(*) as count
FROM wallets 
WHERE currency = 'USDT'
GROUP BY status
ORDER BY status;

-- Reset all USDT wallets to AVAILABLE
UPDATE wallets 
SET 
  status = 'AVAILABLE',
  last_used_at = NULL,
  updated_at = NOW()
WHERE currency = 'USDT';

-- Show final state
SELECT 
  'AFTER RESET' as status,
  status,
  COUNT(*) as count
FROM wallets 
WHERE currency = 'USDT'
GROUP BY status
ORDER BY status;

SELECT 'SUCCESS: All USDT wallets reset to AVAILABLE status' as result;