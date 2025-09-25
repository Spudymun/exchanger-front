-- Проверить существующие адреса USDT
SELECT address, currency, status 
FROM wallets 
WHERE address IN (
  '0xa0b86a33E6c6cA2F91e9FdE7Be3fEbC4E4c3eE25',
  '0x3fE9C7c9b0F8F7f0c5f5e3c9a2c1c9f8e7d6c5b4',
  '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c',
  '0x6b175474e89094c44da98b954eedeac495271d0f'
);