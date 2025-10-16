-- Проверка состояния manual exchange rates
-- Показывает все активные курсы и их статус

SELECT 
    id,
    currency,
    uah_rate,
    is_active,
    valid_until,
    valid_until < NOW() as is_expired,
    EXTRACT(EPOCH FROM (NOW() - valid_until))/3600 as hours_expired,
    created_at,
    updated_at,
    created_by,
    comment
FROM manual_exchange_rates
WHERE is_active = true
ORDER BY currency;
