import { ORDER_STATUS_CONFIG } from '@repo/constants';
import type { Order } from '@repo/exchange-core';
import { DataTable } from '@repo/ui';
import Link from 'next/link';
import type { useTranslations } from 'next-intl';
import * as React from 'react';

// Column definitions split into smaller parts to avoid ESLint line limit
const createPublicIdColumn = (t: ReturnType<typeof useTranslations>) => ({
  key: 'publicId',
  label: t('columns.orderId'),
  render: (order: Order) => (
    <Link
      href={`/order/${order.publicId}`}
      className="text-primary hover:underline font-mono text-sm"
    >
      {order.publicId}
    </Link>
  ),
});

const createStatusColumn = (t: ReturnType<typeof useTranslations>) => ({
  key: 'status',
  label: t('columns.status'),
  render: (order: Order) => {
    const config = ORDER_STATUS_CONFIG[order.status];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}/10 text-${config.color}`}
      >
        {config.label}
      </span>
    );
  },
});

const createCryptoAmountColumn = (t: ReturnType<typeof useTranslations>) => ({
  key: 'cryptoAmount',
  label: t('columns.cryptoAmount'),
  render: (order: Order) => (
    <span className="font-mono">{`${order.cryptoAmount} ${order.currency}`}</span>
  ),
});

const createUahAmountColumn = (t: ReturnType<typeof useTranslations>) => ({
  key: 'uahAmount',
  label: t('columns.uahAmount'),
  render: (order: Order) => (
    <span className="font-mono">{`${order.uahAmount.toLocaleString()} UAH`}</span>
  ),
});

const createCreatedAtColumn = (t: ReturnType<typeof useTranslations>) => ({
  key: 'createdAt',
  label: t('columns.createdAt'),
  render: (order: Order) => (
    <span className="text-sm text-muted-foreground">
      {new Date(order.createdAt).toLocaleString()}
    </span>
  ),
});

const createActionsColumn = (t: ReturnType<typeof useTranslations>) => ({
  key: 'actions',
  label: t('columns.actions'),
  render: (order: Order) => (
    <Link
      href={`/order/${order.publicId}`}
      className="text-sm text-primary hover:underline"
    >
      {t('actions.viewDetails')}
    </Link>
  ),
});

// ⚡ Helper: Create column definitions
export function useOrdersColumns(t: ReturnType<typeof useTranslations>) {
  return React.useMemo(
    () => [
      createPublicIdColumn(t),
      createStatusColumn(t),
      createCryptoAmountColumn(t),
      createUahAmountColumn(t),
      createCreatedAtColumn(t),
      createActionsColumn(t),
    ],
    [t]
  );
}

// ⚡ Helper: Render orders table
export function OrdersTable({
  orders,
  columns,
}: {
  orders: Order[];
  columns: ReturnType<typeof useOrdersColumns>;
}) {
  return (
    <DataTable.TableWrapper>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={String(col.key)} className="text-left p-4 font-medium">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orders.map((order: Order) => (
          <tr key={order.id} className="border-t hover:bg-muted/50">
            {columns.map(col => (
              <DataTable.CellWrapper key={`${order.id}-${String(col.key)}`}>
                {col.render(order)}
              </DataTable.CellWrapper>
            ))}
          </tr>
        ))}
      </tbody>
    </DataTable.TableWrapper>
  );
}

// ⚡ Helper: Render empty state
export function EmptyState({ searchTerm, t }: { searchTerm: string; t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
      <p className="text-lg font-semibold">{t('empty.title')}</p>
      <p className="text-sm text-muted-foreground">
        {searchTerm ? t('empty.noResults') : t('empty.description')}
      </p>
    </div>
  );
}

// ⚡ Helper: Render orders table content
export function OrdersTableContent({
  orders,
  isLoading,
  searchTerm,
  columns,
  t,
}: {
  orders: Order[];
  isLoading: boolean;
  searchTerm: string;
  columns: ReturnType<typeof useOrdersColumns>;
  t: ReturnType<typeof useTranslations>;
}) {
  if (orders.length === 0 && !isLoading) {
    return <EmptyState searchTerm={searchTerm} t={t} />;
  }
  return <OrdersTable orders={orders} columns={columns} />;
}
