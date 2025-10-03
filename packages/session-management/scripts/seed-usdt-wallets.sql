-- ============================================================================
-- USDT WALLETS SEEDING - Test Data for Development
-- ============================================================================
-- Заполняет таблицу wallets тестовыми USDT адресами из MOCK_CRYPTO_ADDRESSES
-- для устранения ошибки "No available wallets for currency USDT"
-- ============================================================================

-- Safety check: Prevent execution in production
DO $$
BEGIN
  IF current_setting('server_version_num')::int >= 120000 THEN
    IF current_database() LIKE '%prod%' OR current_database() LIKE '%production%' THEN
      RAISE EXCEPTION 'BLOCKED: Cannot seed test data in production database: %', current_database();
    END IF;
  END IF;
END $$;

-- Show current state before seeding
SELECT 
  'BEFORE USDT SEEDING' as status,
  (SELECT COUNT(*) FROM wallets WHERE currency = 'USDT') as usdt_wallets_count,
  (SELECT COUNT(*) FROM wallets WHERE currency = 'USDT' AND status = 'available') as available_usdt_count,
  (SELECT COUNT(*) FROM wallets) as total_wallets_count,
  current_database() as database_name,
  NOW() as timestamp;

-- Insert USDT test wallets based on MOCK_CRYPTO_ADDRESSES.USDT from packages/constants/src/exchange-currencies.ts
-- These addresses are MOCK addresses from the constants file for testing purposes ONLY

-- АНАЛИЗ ПОЛЕЙ:
-- id - автогенерируется через gen_random_uuid()
-- address - ОБЯЗАТЕЛЬНО, уникальное
-- currency - ОБЯЗАТЕЛЬНО 
-- token_standard - опционально (NULL для USDT)
-- status - автоматически AVAILABLE (available в БД)
-- label - опционально (NULL)
-- notes - опционально (NULL)  
-- total_orders - автоматически 0
-- last_used_at - опционально (NULL)
-- created_at - автоматически NOW()
-- updated_at - автоматически NOW() и обновляется при изменениях
-- disabled_at - опционально (NULL)

INSERT INTO wallets (address, currency, token_standard, updated_at) VALUES
-- ERC-20 USDT (Ethereum) - самый популярный стандарт
('0xa0b86a33E6c6cA2F91e9FdE7Be3fEbC4E4c3eE25', 'USDT', 'ERC-20', NOW()),
('0x3fE9C7c9b0F8F7f0c5f5e3c9a2c1c9f8e7d6c5b4', 'USDT', 'ERC-20', NOW()),
-- TRC-20 USDT (Tron) - низкие комиссии
('TQn9Y2khEsLJW1ChVWFMSMeRDow5oNDMHh', 'USDT', 'TRC-20', NOW()),
('TSMKhyfd7E3UaQ3C5vbJqQybcBCvJqmgqh', 'USDT', 'TRC-20', NOW()),
('TXYZabcd1234567890efghijklmnopqrstuv', 'USDT', 'TRC-20', NOW()),
-- BEP-20 USDT (BSC) - Binance Smart Chain  
('0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c', 'USDT', 'BEP-20', NOW()),
-- Solana USDT (SPL Token)
('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 'USDT', 'SPL', NOW())

-- Handle conflicts gracefully (addresses might already exist)
ON CONFLICT (address) DO NOTHING;

-- Show final state after seeding
SELECT 
  'AFTER USDT SEEDING' as status,
  (SELECT COUNT(*) FROM wallets WHERE currency = 'USDT') as usdt_wallets_count,
  (SELECT COUNT(*) FROM wallets WHERE currency = 'USDT' AND status = 'available') as available_usdt_count,
  (SELECT COUNT(*) FROM wallets WHERE currency = 'USDT' AND status = 'allocated') as allocated_usdt_count,
  (SELECT COUNT(*) FROM wallets) as total_wallets_count,
  current_database() as database_name,
  NOW() as timestamp;

-- ✅ INFO: USDT wallet pool seeded with 4 mock addresses
-- ⚠️  WARNING: These are TEST addresses only, not for production use!
-- 🎯 PURPOSE: Enables ImmediateAllocationStrategy to allocate USDT wallets from database