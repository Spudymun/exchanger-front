-- ============================================================================
-- UAH BANKS SEEDING - Create UAH Banks from Mock Data
-- ============================================================================
-- Мигрирует данные UAH банков из packages/constants/src/banks.ts в БД
-- Источник: BANKS_BY_CURRENCY.UAH + MOCK_BANK_RESERVES
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
  'BEFORE UAH BANKS SEEDING' as status,
  (SELECT COUNT(*) FROM banks) as total_banks,
  (SELECT COUNT(*) FROM bank_fiat_currencies WHERE fiat_currency = 'UAH') as uah_currencies,
  (SELECT COUNT(*) FROM bank_reserves WHERE fiat_currency = 'UAH') as uah_reserves;

-- ============================================================================
-- STEP 1: Insert UAH Banks (from BANKS_BY_CURRENCY.UAH)
-- ============================================================================

INSERT INTO banks (external_id, name, short_name, logo_url, is_active, is_default)
VALUES
  ('privatbank', 'ПриватБанк', 'Приват', '/images/banks/privatbank.svg', true, false),
  ('monobank', 'Монобанк', 'Моно', '/images/banks/monobank.svg', true, true),
  ('pumb', 'ПУМБ', 'ПУМБ', '/images/banks/pumb.svg', true, false),
  ('oschadbank', 'Ощадбанк', 'Ощад', '/images/banks/oschadbank.svg', true, false)
ON CONFLICT (external_id) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  logo_url = EXCLUDED.logo_url,
  is_active = EXCLUDED.is_active,
  is_default = EXCLUDED.is_default;

-- ============================================================================
-- STEP 2: Insert UAH Currency Support
-- ============================================================================

INSERT INTO bank_fiat_currencies (bank_id, fiat_currency, min_amount, max_amount, is_enabled)
SELECT
  b.id,
  'UAH',
  CASE b.external_id
    WHEN 'privatbank' THEN 100.00
    WHEN 'monobank' THEN 200.00
    WHEN 'pumb' THEN 150.00
    WHEN 'oschadbank' THEN 100.00
  END,
  CASE b.external_id
    WHEN 'privatbank' THEN 100000.00
    WHEN 'monobank' THEN 80000.00
    WHEN 'pumb' THEN 60000.00
    WHEN 'oschadbank' THEN 50000.00
  END,
  true
FROM banks b
WHERE b.external_id IN ('privatbank', 'monobank', 'pumb', 'oschadbank')
ON CONFLICT (bank_id, fiat_currency) DO UPDATE SET
  min_amount = EXCLUDED.min_amount,
  max_amount = EXCLUDED.max_amount,
  is_enabled = EXCLUDED.is_enabled;

-- ============================================================================
-- STEP 3: Insert UAH Reserves (from MOCK_BANK_RESERVES)
-- ============================================================================

INSERT INTO bank_reserves (bank_id, fiat_currency, amount)
SELECT
  b.id,
  'UAH',
  CASE b.external_id
    WHEN 'privatbank' THEN 10000000.00  -- 10 млн UAH
    WHEN 'monobank' THEN 5000000.00     -- 5 млн UAH
    WHEN 'pumb' THEN 3000000.00         -- 3 млн UAH
    WHEN 'oschadbank' THEN 2000000.00   -- 2 млн UAH
  END
FROM banks b
WHERE b.external_id IN ('privatbank', 'monobank', 'pumb', 'oschadbank')
ON CONFLICT (bank_id, fiat_currency) DO UPDATE SET
  amount = EXCLUDED.amount,
  last_updated = NOW();

-- Show results after seeding
SELECT
  'AFTER UAH BANKS SEEDING' as status,
  (SELECT COUNT(*) FROM banks) as total_banks,
  (SELECT COUNT(*) FROM bank_fiat_currencies WHERE fiat_currency = 'UAH') as uah_currencies,
  (SELECT COUNT(*) FROM bank_reserves WHERE fiat_currency = 'UAH') as uah_reserves;

-- Verify seeded data
SELECT
  'VERIFICATION: UAH BANKS DATA' as section,
  b.external_id,
  b.name,
  b.short_name,
  b.is_default,
  bfc.min_amount,
  bfc.max_amount,
  br.amount as reserve
FROM banks b
LEFT JOIN bank_fiat_currencies bfc ON b.id = bfc.bank_id AND bfc.fiat_currency = 'UAH'
LEFT JOIN bank_reserves br ON b.id = br.bank_id AND br.fiat_currency = 'UAH'
WHERE b.external_id IN ('privatbank', 'monobank', 'pumb', 'oschadbank')
ORDER BY b.is_default DESC, b.name;