-- Проверка последней созданной заявки и ее tokenStandard
SELECT 
  o.id,
  o.public_id,
  o.currency,
  o.token_standard,
  o.crypto_amount,
  o.uah_amount,
  o.created_at,
  u.email,
  w.address as wallet_address,
  w.token_standard as wallet_token_standard
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN wallets w ON o.wallet_id = w.id
ORDER BY o.created_at DESC
LIMIT 5;