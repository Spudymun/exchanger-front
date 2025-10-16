-- Вставка ручного курса USDT в таблицу manual_exchange_rates
-- Курс основан на текущем Binance P2P рынке: ~42.22 UAH за 1 USDT

INSERT INTO manual_exchange_rates (
    currency,
    uah_rate,
    is_active,
    valid_until,
    created_by,
    comment
) VALUES (
    'USDT',
    42.22,
    true,
    NOW() + INTERVAL '30 days', -- Действителен 30 дней
    'system',
    'Fallback курс на основе Binance P2P рынка (42.22 UAH). Используется когда P2P API недоступен.'
)
ON CONFLICT (currency, is_active) 
WHERE is_active = true
DO UPDATE SET
    uah_rate = EXCLUDED.uah_rate,
    valid_until = EXCLUDED.valid_until,
    comment = EXCLUDED.comment,
    updated_at = NOW();

-- Проверка вставки
SELECT 
    currency,
    uah_rate,
    is_active,
    valid_until,
    created_by,
    comment,
    created_at
FROM manual_exchange_rates
WHERE currency = 'USDT' AND is_active = true;
