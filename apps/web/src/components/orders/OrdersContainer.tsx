// Container компонент с множественными helper функциями
'use client';

import { ORDER_STATUS_CONFIG, VALIDATION_LIMITS, type OrderStatus } from '@repo/constants';
import type { Order } from '@repo/exchange-core';
import { useAuthProtectedPage, AuthErrorState } from '@repo/providers';
import { DataTable, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui';
import { getStatusColorClass } from '@repo/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import { trpc } from '../../../lib/trpc-provider';

// Constants
const ORDERS_PER_PAGE = VALIDATION_LIMITS.DEFAULT_PAGE_SIZE;
const UNAUTHORIZED_ERROR_KEY = 'auth.required'; // Fixed: removed 'server.errors' prefix as it's already in useTranslations namespace

// Types for sort options
type OrderSortOption = 'newest' | 'oldest';

interface OrdersContainerProps {
  initialPage?: number;
  initialStatus?: string;
  initialSearch?: string;
  initialSortBy?: string;
}

// ⚡ Helper: Create column definitions (extracted to reduce complexity)
function useOrdersColumns(
  t: ReturnType<typeof useTranslations>,
  tOrderStatus: ReturnType<typeof useTranslations>
) {
  return React.useMemo(
    () => [
      {
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
      },
      {
        key: 'status',
        label: t('columns.status'),
        render: (order: Order) => {
          const statusLabel = tOrderStatus(`statuses.${order.status}` as const);
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(order.status)}`}
            >
              {statusLabel}
            </span>
          );
        },
      },
      {
        key: 'cryptoAmount',
        label: t('columns.cryptoAmount'),
        render: (order: Order) => (
          <span className="font-mono">{`${order.cryptoAmount} ${order.currency}`}</span>
        ),
      },
      {
        key: 'uahAmount',
        label: t('columns.uahAmount'),
        render: (order: Order) => (
          <span className="font-mono">{`${order.uahAmount.toLocaleString()} UAH`}</span>
        ),
      },
      {
        key: 'createdAt',
        label: t('columns.createdAt'),
        render: (order: Order) => (
          <span className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleString()}
          </span>
        ),
      },
      {
        key: 'actions',
        label: t('columns.actions'),
        render: (order: Order) => (
          <Link href={`/order/${order.publicId}`} className="text-sm text-primary hover:underline">
            {t('actions.viewDetails')}
          </Link>
        ),
      },
    ],
    [t, tOrderStatus]
  );
}

// ⚡ Helper: Render empty state
function EmptyState({
  searchTerm,
  t,
}: {
  searchTerm: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
      <p className="text-lg font-semibold">{t('empty.title')}</p>
      <p className="text-sm text-muted-foreground">
        {searchTerm ? t('empty.noResults') : t('empty.description')}
      </p>
    </div>
  );
}

// ⚡ Helper: Render table content
function OrdersTable({
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

// ⚡ Helper: Render filters
function OrdersFilters({
  statusFilter,
  sortBy,
  onStatusChange,
  onSortChange,
  t,
  tOrderStatus,
}: {
  statusFilter: OrderStatus | undefined;
  sortBy: OrderSortOption;
  onStatusChange: (status: OrderStatus | undefined) => void;
  onSortChange: (sort: OrderSortOption) => void;
  t: ReturnType<typeof useTranslations>;
  tOrderStatus: ReturnType<typeof useTranslations>;
}) {
  return (
    <DataTable.Filters searchPlaceholder={t('search.placeholder')}>
      <div className="flex gap-2 items-center">
        <label className="text-sm font-medium">{t('filters.status')}</label>
        <Select
          value={statusFilter || 'all'}
          onValueChange={value =>
            onStatusChange(value === 'all' ? undefined : (value as OrderStatus))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('filters.allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
            {Object.keys(ORDER_STATUS_CONFIG).map(status => (
              <SelectItem key={status} value={status}>
                {tOrderStatus(`statuses.${status}` as const)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 items-center">
        <label className="text-sm font-medium">{t('filters.sortBy')}</label>
        <Select value={sortBy} onValueChange={value => onSortChange(value as OrderSortOption)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('sort.newest')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t('sort.newest')}</SelectItem>
            <SelectItem value="oldest">{t('sort.oldest')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </DataTable.Filters>
  );
}

// ⚡ Helper: Initialize state from props
function useOrdersState(props: OrdersContainerProps) {
  const [currentPage, setCurrentPage] = React.useState(props.initialPage ?? 1);
  const [searchTerm, setSearchTerm] = React.useState(props.initialSearch ?? '');
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | undefined>(
    props.initialStatus as OrderStatus | undefined
  );
  const [sortBy, setSortBy] = React.useState<OrderSortOption>(
    (props.initialSortBy as OrderSortOption) ?? 'newest'
  );

  return {
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
  };
}

// ⚡ Helper: Create handlers (extracted to reduce complexity)
function useOrdersHandlers(
  setSearchTerm: (term: string) => void,
  setCurrentPage: (page: number) => void
) {
  const handleSearch = React.useCallback(
    (term: string) => {
      setSearchTerm(term);
      setCurrentPage(1);
    },
    [setSearchTerm, setCurrentPage]
  );

  const handlePageChange = React.useCallback(
    (page: number) => {
      setCurrentPage(page);
    },
    [setCurrentPage]
  );

  return { handleSearch, handlePageChange };
}

// ⚡ Main component
/* eslint-disable max-lines-per-function */ // Допустимо для container компонентов с множественными handlers
/* eslint-disable complexity */ // Container компонент с auth protection и множественными условиями
/* eslint-disable max-lines */ // Container компонент с локализацией статусов требует дополнительной логики
export function OrdersContainer(props: OrdersContainerProps) {
  const t = useTranslations('OrdersPage');
  const tOrderStatus = useTranslations('OrderStatus');
  const tErrors = useTranslations('server.errors');
  const router = useRouter();

  // ✅ Auth protection - проверяем сессию СНАЧАЛА
  const { data: session } = trpc.auth.getSession.useQuery();
  const { onAuthRequired } = useAuthProtectedPage({
    onRedirect: () => router.push('/'),
    session,
  });

  // State management
  const {
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
  } = useOrdersState(props);

  // Handlers
  const { handleSearch, handlePageChange } = useOrdersHandlers(setSearchTerm, setCurrentPage);

  // tRPC query - ВСЕГДА вызываем хук (не условно!)
  // enabled: !!session?.user - запрос идет ТОЛЬКО если есть сессия
  const { data, isLoading, error } = trpc.shared.orders.getAll.useQuery(
    {
      filters: {
        status: statusFilter,
        searchQuery: searchTerm || undefined,
      },
      sortBy,
      pagination: { limit: ORDERS_PER_PAGE, offset: (currentPage - 1) * ORDERS_PER_PAGE },
    },
    {
      enabled: !!session?.user, // ← КЛЮЧЕВОЕ: запрос только если авторизован
    }
  );

  // Column definitions
  const columns = useOrdersColumns(t, tOrderStatus);

  // ✅ Если нет сессии - показываем AuthErrorState
  // КРИТИЧЕСКИ ВАЖНО: проверяем session !== undefined чтобы отличить "загружается" от "не залогинен"
  // session === undefined → ничего не рендерим (загрузка)
  // session !== undefined && !session?.user → показываем AuthErrorState (не залогинен)
  if (session !== undefined && !session?.user) {
    return (
      <AuthErrorState
        error={
          {
            message: tErrors(UNAUTHORIZED_ERROR_KEY),
            data: { code: 'UNAUTHORIZED' },
          } as Error & { data?: { code?: string } }
        }
        translations={{
          fetchFailed: t('errors.fetchFailed'),
          unauthorizedMessage: tErrors(UNAUTHORIZED_ERROR_KEY),
        }}
        onLoginRequired={onAuthRequired}
      />
    );
  }

  // ✅ Render error state с auth protection
  if (error) {
    return (
      <AuthErrorState
        error={error as Error & { data?: { code?: string } }}
        translations={{
          fetchFailed: t('errors.fetchFailed'),
          unauthorizedMessage: tErrors(UNAUTHORIZED_ERROR_KEY),
        }}
        onLoginRequired={onAuthRequired}
      />
    );
  }

  const orders = data?.items || [];

  return (
    <DataTable
      data={orders}
      isLoading={isLoading}
      searchTerm={searchTerm}
      currentPage={currentPage}
      itemsPerPage={ORDERS_PER_PAGE}
      totalItems={data?.total} // ✅ ИСПРАВЛЕНО: передаем реальное total из API для server-side pagination
      onSearch={handleSearch}
      onPageChange={handlePageChange}
    >
      <DataTable.Container variant="bordered">
        <DataTable.Header title={t('title')} description={t('description')} />

        <OrdersFilters
          statusFilter={statusFilter}
          sortBy={sortBy}
          onStatusChange={setStatusFilter}
          onSortChange={setSortBy}
          t={t}
          tOrderStatus={tOrderStatus}
        />

        <DataTable.Content>
          {orders.length === 0 && !isLoading ? (
            <EmptyState searchTerm={searchTerm} t={t} />
          ) : (
            <OrdersTable orders={orders} columns={columns} />
          )}
        </DataTable.Content>

        <DataTable.Pagination showInfo={true} />
      </DataTable.Container>
    </DataTable>
  );
}
