/* eslint-disable max-lines */ // Container компонент с множественными helper функциями
'use client';

import { ORDER_STATUS_CONFIG, VALIDATION_LIMITS, type OrderStatus } from '@repo/constants';
import type { Order } from '@repo/exchange-core';
import { useAuthModal } from '@repo/providers';
import { DataTable, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui';
import { getStatusColorClass } from '@repo/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import { trpc } from '../../../lib/trpc-provider';

// Constants
const ORDERS_PER_PAGE = VALIDATION_LIMITS.DEFAULT_PAGE_SIZE;
const UNAUTHORIZED_ERROR_KEY = 'server.errors.auth.required';

// Types for sort options
type OrderSortOption = 'newest' | 'oldest';

interface OrdersContainerProps {
  initialPage?: number;
  initialStatus?: string;
  initialSearch?: string;
  initialSortBy?: string;
}

// ⚡ Helper: Create column definitions (extracted to reduce complexity)
function useOrdersColumns(t: ReturnType<typeof useTranslations>) {
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
          const config = ORDER_STATUS_CONFIG[order.status];
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(order.status)}`}
            >
              {config.label}
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
          <Link
            href={`/order/${order.publicId}`}
            className="text-sm text-primary hover:underline"
          >
            {t('actions.viewDetails')}
          </Link>
        ),
      },
    ],
    [t]
  );
}

// ⚡ Helper: Render empty state
function EmptyState({ searchTerm, t }: { searchTerm: string; t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
      <p className="text-lg font-semibold">{t('empty.title')}</p>
      <p className="text-sm text-muted-foreground">
        {searchTerm ? t('empty.noResults') : t('empty.description')}
      </p>
    </div>
  );
}

// ⚡ Helper: Render error state
function ErrorState({ 
  error, 
  t, 
  tErrors,
  onLoginRequired 
}: { 
  error: Error & { data?: { code?: string } }; 
  t: ReturnType<typeof useTranslations>;
  tErrors: ReturnType<typeof useTranslations>;
  onLoginRequired: () => void;
}) {
  // ✅ Обработка UNAUTHORIZED: показываем перевод + открываем модалку логина
  React.useEffect(() => {
    const isUnauthorized = error.data?.code === 'UNAUTHORIZED' || 
                          error.message.includes(UNAUTHORIZED_ERROR_KEY);
    
    if (isUnauthorized) {
      onLoginRequired();
    }
  }, [error, onLoginRequired]);

  const isUnauthorized = error.data?.code === 'UNAUTHORIZED' || 
                         error.message.includes(UNAUTHORIZED_ERROR_KEY);
  
  const errorMessage = isUnauthorized 
    ? tErrors(UNAUTHORIZED_ERROR_KEY)
    : error.message;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <p className="text-destructive text-lg">{t('errors.fetchFailed')}</p>
      <p className="text-sm text-muted-foreground">{errorMessage}</p>
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
}: {
  statusFilter: OrderStatus | undefined;
  sortBy: OrderSortOption;
  onStatusChange: (status: OrderStatus | undefined) => void;
  onSortChange: (sort: OrderSortOption) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <DataTable.Filters searchPlaceholder={t('search.placeholder')}>
      <div className="flex gap-2 items-center">
        <label className="text-sm font-medium">
          {t('filters.status')}
        </label>
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
            {Object.entries(ORDER_STATUS_CONFIG).map(([status, config]) => (
              <SelectItem key={status} value={status}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 items-center">
        <label className="text-sm font-medium">
          {t('filters.sortBy')}
        </label>
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
  const [sortBy, setSortBy] = React.useState<OrderSortOption>((props.initialSortBy as OrderSortOption) ?? 'newest');

  return { currentPage, setCurrentPage, searchTerm, setSearchTerm, statusFilter, setStatusFilter, sortBy, setSortBy };
}

// ⚡ Helper: Create handlers (extracted to reduce complexity)
function useOrdersHandlers(
  setSearchTerm: (term: string) => void,
  setCurrentPage: (page: number) => void
) {
  const handleSearch = React.useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, [setSearchTerm, setCurrentPage]);

  const handlePageChange = React.useCallback((page: number) => {
    setCurrentPage(page);
  }, [setCurrentPage]);

  return { handleSearch, handlePageChange };
}

// ⚡ Main component
/* eslint-disable max-lines-per-function */ // Допустимо для container компонентов с множественными handlers
export function OrdersContainer(props: OrdersContainerProps) {
  const t = useTranslations('OrdersPage');
  const tErrors = useTranslations('server.errors');
  const authModal = useAuthModal();
  const router = useRouter();

  // State management
  const { currentPage, setCurrentPage, searchTerm, setSearchTerm, statusFilter, setStatusFilter, sortBy, setSortBy } = useOrdersState(props);
  
  // Handlers
  const { handleSearch, handlePageChange } = useOrdersHandlers(setSearchTerm, setCurrentPage);

  // ✅ Получаем сессию для проверки авторизации при закрытии модалки
  const { data: session } = trpc.auth.getSession.useQuery();
  const wasModalOpenRef = React.useRef(false);

  // ✅ Отслеживаем открытие модалки
  React.useEffect(() => {
    if (authModal.isLoginOpen || authModal.isRegisterOpen || authModal.isForgotPasswordOpen) {
      wasModalOpenRef.current = true;
    }
  }, [authModal.isLoginOpen, authModal.isRegisterOpen, authModal.isForgotPasswordOpen]);

  // ✅ Редирект на главную если пользователь закрыл модалку крестиком (без успешного логина)
  React.useEffect(() => {
    const allModalsClosed = !authModal.isLoginOpen && !authModal.isRegisterOpen && !authModal.isForgotPasswordOpen;
    
    // Если модалка была открыта и теперь закрыта, но пользователь не авторизован → редирект
    if (wasModalOpenRef.current && allModalsClosed && !session?.user) {
      router.push('/');
    }
    
    // Сбрасываем флаг при закрытии (в любом случае - успешный логин или крестик)
    if (wasModalOpenRef.current && allModalsClosed) {
      wasModalOpenRef.current = false;
    }
  }, [authModal.isLoginOpen, authModal.isRegisterOpen, authModal.isForgotPasswordOpen, session, router]);

  // tRPC query
  const { data, isLoading, error } = trpc.shared.orders.getAll.useQuery({
    filters: { 
      status: statusFilter,
      searchQuery: searchTerm || undefined,
    },
    sortBy,
    pagination: { limit: ORDERS_PER_PAGE, offset: (currentPage - 1) * ORDERS_PER_PAGE },
  });

  // Column definitions
  const columns = useOrdersColumns(t);

  // Render error state
  if (error) {
    return <ErrorState error={error} t={t} tErrors={tErrors} onLoginRequired={authModal.openLogin} />;
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
