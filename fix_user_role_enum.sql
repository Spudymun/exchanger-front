-- Создание PostgreSQL enum для UserRole
CREATE TYPE "UserRole" AS ENUM ('user', 'admin', 'operator', 'support');

-- Удаление старого constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Изменение типа колонки role
ALTER TABLE users ALTER COLUMN role TYPE "UserRole" USING role::"UserRole";

-- Установка значения по умолчанию
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'::"UserRole";
