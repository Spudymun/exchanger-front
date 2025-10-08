-- ============================================================================
-- TEST ORDERS SEEDING - 60 Orders for spudymun@gmail.com
-- ============================================================================
-- Создает 60 тестовых заказов для пользователя spudymun@gmail.com
-- со всеми статусами для тестирования пагинации на странице Orders
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
  'BEFORE TEST ORDERS SEEDING' as status,
  (SELECT COUNT(*) FROM orders WHERE user_id = '0a92fa1d-1aef-40a4-b863-1e0da3841dc2') as current_orders_count,
  (SELECT email FROM users WHERE id = '0a92fa1d-1aef-40a4-b863-1e0da3841dc2') as user_email,
  current_database() as database_name,
  NOW() as timestamp;

-- Variables
DO $$
DECLARE
  v_user_id UUID := '0a92fa1d-1aef-40a4-b863-1e0da3841dc2'; -- spudymun@gmail.com
  v_wallet_ids UUID[] := ARRAY[
    '3dcdd052-67a0-4983-b088-4a7c16d2b252'::UUID, -- TRC-20: TQn9Y2khEsLJW1ChVWFMSMeRDow5oNDMHh
    '1cdd2a22-ef13-454a-abdf-a9a5fd3b1374'::UUID, -- TRC-20: TSMKhyfd7E3UaQ3C5vbJqQybcBCvJqmgqh
    '5c7c05ca-57ec-435c-88fd-18bd20b77e39'::UUID  -- TRC-20: TXYZabcd1234567890efghijklmnopqrstuv
  ];
  v_bank_ids UUID[] := ARRAY[
    '16b91d14-4093-4589-a344-8935d34322d1'::UUID, -- privatbank
    '736e18a0-de1d-4726-a1e4-e3a956fb876c'::UUID, -- monobank
    '5146338d-9146-4d58-b995-83af258c6aa3'::UUID, -- pumb
    'c57f5ae5-d1aa-415d-b57c-a21c5141e367'::UUID  -- oschadbank
  ];
  v_statuses TEXT[] := ARRAY['pending', 'paid', 'processing', 'completed', 'cancelled', 'failed'];
  v_base_timestamp BIGINT := EXTRACT(EPOCH FROM NOW())::BIGINT * 1000;
  v_counter INT;
  v_current_status TEXT;
  v_wallet_id UUID;
  v_bank_id UUID;
  v_crypto_amount DECIMAL(36, 18);
  v_uah_amount DECIMAL(12, 2);
  v_exchange_rate DECIMAL(15, 8);
  v_public_id TEXT;
  v_card_numbers TEXT[] := ARRAY[
    '4441114410644270',
    '5168748752963604',
    '4731183258837352',
    '5404729272600797',
    '4731189552593153',
    '4149495642619387',
    '4149623394045515',
    '5168746667725621',
    '5580141225841179',
    '5363549685864189'
  ];
  v_card_number TEXT;
  v_bank_external_id TEXT;
  v_recipient_data JSONB;
  v_created_at TIMESTAMPTZ;
  v_processed_at TIMESTAMPTZ;
BEGIN
  -- Создаем 60 заказов (по 10 для каждого статуса)
  FOR v_counter IN 1..60 LOOP
    -- Определяем статус (меняем каждые 10 заказов)
    v_current_status := v_statuses[((v_counter - 1) / 10) + 1];
    
    -- Случайный выбор кошелька и банка
    v_wallet_id := v_wallet_ids[(v_counter % 3) + 1];
    v_bank_id := v_bank_ids[(v_counter % 4) + 1];
    
    -- Генерация суммы (от 10 до 500 USDT)
    v_crypto_amount := (10 + (v_counter * 7) % 490)::DECIMAL(36, 18);
    
    -- Курс обмена (40.5 - 41.5)
    v_exchange_rate := (40.5 + (v_counter % 10) * 0.1)::DECIMAL(15, 8);
    
    -- Расчет UAH суммы
    v_uah_amount := (v_crypto_amount * v_exchange_rate)::DECIMAL(12, 2);
    
    -- Генерация publicId
    v_public_id := 'order_' || (v_base_timestamp + v_counter * 1000)::TEXT || '_' || 
                   substring(md5(random()::text) from 1 for 9);
    
    -- Выбор номера карты и получение external_id банка
    v_card_number := v_card_numbers[(v_counter % 10) + 1];
    SELECT external_id INTO v_bank_external_id FROM banks WHERE id = v_bank_id;
    
    -- Формирование recipientData
    v_recipient_data := jsonb_build_object(
      'bankId', v_bank_external_id,
      'cardNumber', v_card_number
    );
    
    -- Timestamp для заказа (распределяем во времени за последние 30 дней)
    v_created_at := NOW() - (v_counter || ' days')::INTERVAL;
    
    -- Для завершенных заказов добавляем processedAt
    v_processed_at := CASE 
      WHEN v_current_status IN ('completed', 'cancelled', 'failed') 
      THEN v_created_at + ((random() * 24)::INT || ' hours')::INTERVAL
      ELSE NULL 
    END;
    
    -- Вставка заказа
    INSERT INTO orders (
      public_id,
      user_id,
      crypto_amount,
      currency,
      uah_amount,
      status,
      recipient_data,
      wallet_id,
      bank_id,
      fixed_exchange_rate,
      created_at,
      updated_at,
      processed_at,
      tx_hash
    ) VALUES (
      v_public_id,
      v_user_id,
      v_crypto_amount,
      'USDT',
      v_uah_amount,
      v_current_status::"OrderStatus",
      v_recipient_data,
      v_wallet_id,
      v_bank_id,
      v_exchange_rate,
      v_created_at,
      v_created_at,
      v_processed_at,
      CASE 
        WHEN v_current_status = 'completed' 
        THEN '0x' || substring(md5(random()::text) from 1 for 64)
        ELSE NULL 
      END
    );
    
    -- Логирование прогресса каждые 10 заказов
    IF v_counter % 10 = 0 THEN
      RAISE NOTICE 'Created % orders (status: %)', v_counter, v_current_status;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Successfully created 60 test orders for spudymun@gmail.com';
END $$;

-- Show results after seeding
SELECT 
  'AFTER TEST ORDERS SEEDING' as status,
  (SELECT COUNT(*) FROM orders WHERE user_id = '0a92fa1d-1aef-40a4-b863-1e0da3841dc2') as total_orders,
  (SELECT COUNT(*) FROM orders WHERE user_id = '0a92fa1d-1aef-40a4-b863-1e0da3841dc2' AND status = 'pending') as pending_orders,
  (SELECT COUNT(*) FROM orders WHERE user_id = '0a92fa1d-1aef-40a4-b863-1e0da3841dc2' AND status = 'paid') as paid_orders,
  (SELECT COUNT(*) FROM orders WHERE user_id = '0a92fa1d-1aef-40a4-b863-1e0da3841dc2' AND status = 'processing') as processing_orders,
  (SELECT COUNT(*) FROM orders WHERE user_id = '0a92fa1d-1aef-40a4-b863-1e0da3841dc2' AND status = 'completed') as completed_orders,
  (SELECT COUNT(*) FROM orders WHERE user_id = '0a92fa1d-1aef-40a4-b863-1e0da3841dc2' AND status = 'cancelled') as cancelled_orders,
  (SELECT COUNT(*) FROM orders WHERE user_id = '0a92fa1d-1aef-40a4-b863-1e0da3841dc2' AND status = 'failed') as failed_orders,
  current_database() as database_name,
  NOW() as timestamp;

-- Summary by status
SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as earliest_order,
  MAX(created_at) as latest_order
FROM orders 
WHERE user_id = '0a92fa1d-1aef-40a4-b863-1e0da3841dc2'
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'pending' THEN 1
    WHEN 'paid' THEN 2
    WHEN 'processing' THEN 3
    WHEN 'completed' THEN 4
    WHEN 'cancelled' THEN 5
    WHEN 'failed' THEN 6
  END;
