-- Проверка состояния базы данных
-- 1. Список всех таблиц
SELECT 'TABLES' as type, table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- 2. Структура таблицы users  
SELECT 'USER_COLUMNS' as type, column_name, data_type FROM information_schema.columns WHERE table_name = 'users';

-- 3. Все пользователи
SELECT 'ALL_USERS' as type, id, email, telegram_id, created_at FROM users;

-- 4. Проверка конкретного telegramId
SELECT 'TELEGRAM_621882329' as type, COUNT(*) as exists_count FROM users WHERE telegram_id = '621882329';