#!/bin/sh
set -e

echo "🚀 Starting Web Application (Development)"

# Wait for database to be ready
echo "⏳ Waiting for database..."
until npx prisma db execute --stdin --schema ../../packages/session-management/prisma/schema.prisma <<EOF 2>/dev/null
SELECT 1;
EOF
do
  echo "   Database not ready, waiting..."
  sleep 2
done
echo "✅ Database is ready"

# Run Prisma migrations (push in development for faster iteration)
echo "📦 Running Prisma migrations (development mode)..."
npx prisma db push --schema ../../packages/session-management/prisma/schema.prisma --accept-data-loss

# Check if banks table is empty
echo "📊 Checking if database needs seeding..."
BANKS_COUNT=$(npx prisma db execute --stdin --schema ../../packages/session-management/prisma/schema.prisma <<EOF | grep -o '[0-9]*' | head -1
SELECT COUNT(*) as count FROM banks;
EOF
)

echo "   Banks in database: ${BANKS_COUNT:-0}"

# Seed only if database is empty
if [ "${BANKS_COUNT:-0}" = "0" ]; then
  echo "🌱 Database is empty, running development seeds..."
  
  echo "   → Seeding USDT wallets..."
  npx prisma db execute --file ../../packages/session-management/scripts/seed-usdt-wallets.sql --schema ../../packages/session-management/prisma/schema.prisma 2>&1 | grep -v "BLOCKED" || true
  
  echo "   → Seeding UAH banks..."
  npx prisma db execute --file ../../packages/session-management/scripts/seed-uah-banks.sql --schema ../../packages/session-management/prisma/schema.prisma 2>&1 | grep -v "BLOCKED" || true
  
  echo "✅ Seeding completed"
else
  echo "ℹ️  Database already has data, skipping seeds"
fi

echo "🎯 Starting Next.js in development mode..."
exec "$@"
