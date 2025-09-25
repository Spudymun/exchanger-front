-- Очистить все USDT кошельки и пересоздать с нуля
DELETE FROM wallets WHERE currency = 'USDT';

-- Вставить правильные USDT кошельки с разными стандартами
INSERT INTO wallets (address, currency, token_standard, updated_at) VALUES
-- ERC-20 USDT (Ethereum)
('0xa0b86a33E6c6cA2F91e9FdE7Be3fEbC4E4c3eE25', 'USDT', 'ERC-20', NOW()),
('0x3fE9C7c9b0F8F7f0c5f5e3c9a2c1c9f8e7d6c5b4', 'USDT', 'ERC-20', NOW()),
-- TRC-20 USDT (Tron)
('TQn9Y2khEsLJW1ChVWFMSMeRDow5oNDMHh', 'USDT', 'TRC-20', NOW()),
('TSMKhyfd7E3UaQ3C5vbJqQybcBCvJqmgqh', 'USDT', 'TRC-20', NOW()),
-- BEP-20 USDT (BSC)
('0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c', 'USDT', 'BEP-20', NOW()),
-- Solana USDT (SPL)
('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 'USDT', 'SPL', NOW());