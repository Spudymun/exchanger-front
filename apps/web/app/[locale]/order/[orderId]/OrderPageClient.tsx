'use client';

import { APP_ROUTES } from '@repo/constants';
import { type Order } from '@repo/exchange-core';
import { useNotifications } from '@repo/hooks/src/client-hooks';
import { useAuthProtectedPage, AuthErrorState } from '@repo/providers';
import { OrderStatus, OrderDevTools, Button, CenteredPageLayout } from '@repo/ui';
import { useTranslations } from 'next-intl';
import React from 'react';

import { trpc } from '../../../../lib/trpc-provider';
import { useOrderStatus } from '../../../../src/hooks/useExchangeMutation';
import { Link, useRouter } from '../../../../src/i18n/navigation';

interface OrderPageClientProps {
  orderId: string;
}

// Константа для ключа ошибки авторизации
const UNAUTHORIZED_ERROR_KEY = 'auth.required';

/**
 * ✅ Helper: Check if error is UNAUTHORIZED
 */
function isUnauthorizedError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    (error as { data?: { code?: string } }).data?.code === 'UNAUTHORIZED'
  );
}

/**
 * ✅ Helper: Check if error is NOT_FOUND
 */
function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    (error as { data?: { code?: string } }).data?.code === 'NOT_FOUND'
  );
}

/**
 * ✅ Hook: Mutations для работы с заказом
 */
function useOrderMutations(orderId: string, onAuthRequired: () => void) {
  const utils = trpc.useUtils();
  const notifications = useNotifications();
  const t = useTranslations('OrderStatus');

  const cancelOrderMutation = trpc.user.orders.cancelOrder.useMutation({
    onSuccess: () => {
      notifications.success(
        t('actions.orderCancelled'),
        t('actions.orderCancelledDescription')
      );
      utils.exchange.getOrderStatus.invalidate({ orderId });
    },
    onError: (err: unknown) => {
      if (isUnauthorizedError(err)) {
        onAuthRequired();
        return;
      }
      notifications.handleApiError(err, t('actions.orderCancelError'));
    },
  });

  const markAsPaidMutation = trpc.user.orders.markAsPaid.useMutation({
    onSuccess: () => {
      notifications.success(
        t('actions.orderMarkedPaid'),
        t('actions.orderMarkedPaidDescription')
      );
      utils.exchange.getOrderStatus.invalidate({ orderId });
    },
    onError: (err: unknown) => {
      if (isUnauthorizedError(err)) {
        onAuthRequired();
        return;
      }
      notifications.handleApiError(err, t('actions.orderMarkPaidError'));
    },
  });

  return {
    handleMarkAsPaid: () => markAsPaidMutation.mutate({ orderId }),
    handleCancelOrder: () => cancelOrderMutation.mutate({ orderId }),
  };
}

/**
 * OrderPageClient - страница детального просмотра заказа с auth protection
 */
/* eslint-disable max-lines-per-function */ // Container компонент с множественными handlers
export function OrderPageClient({ orderId }: OrderPageClientProps) {
  const router = useRouter();
  const t = useTranslations('OrdersPage');
  const tErrors = useTranslations('server.errors');
  const tNotFound = useTranslations('common-ui.NotFound');
  const utils = trpc.useUtils();
  
  // ✅ Auth protection - проверяем сессию СНАЧАЛА
  const { data: session } = trpc.auth.getSession.useQuery();
  const { onAuthRequired } = useAuthProtectedPage({
    onRedirect: () => router.push('/'),
    session,
  });

  // ✅ КРИТИЧНО: Mutations ДОЛЖНЫ вызываться ВСЕГДА (до любых early returns)
  const { handleMarkAsPaid, handleCancelOrder } = useOrderMutations(orderId, onAuthRequired);

  // ✅ Проверяем статус ордера с enabled опцией (только для проверки ошибок)
  const { error: orderError } = useOrderStatus(orderId, {
    enabled: !!session?.user,
  });

  // ✅ Order status hook wrapper для OrderStatus компонента
  const orderStatusHook = React.useCallback(
    (
      id: string,
      options?: { refetchInterval?: number | ((data: unknown) => number | false) }
    ) => {
      const result = useOrderStatus(id, {
        ...options,
        enabled: !!session?.user, // ← КЛЮЧЕВОЕ: запрос только если авторизован
      });
      
      return {
        data: result.data as Order | undefined,
        isLoading: result.isLoading,
        error: result.error as Error | null,
      };
    },
    [session?.user]
  );

  // ✅ Если нет сессии - показываем AuthErrorState
  // КРИТИЧНО: Проверяем session === null (данные загрузились, user нет)
  // НЕ проверяем session === undefined (данные ещё загружаются)
  if (session !== undefined && !session?.user) {
    return (
      <AuthErrorState
        error={{ 
          message: tErrors(UNAUTHORIZED_ERROR_KEY),
          data: { code: 'UNAUTHORIZED' }
        } as Error & { data?: { code?: string } }}
        translations={{
          fetchFailed: t('errors.fetchFailed'),
          unauthorizedMessage: tErrors(UNAUTHORIZED_ERROR_KEY),
        }}
        onLoginRequired={onAuthRequired}
      />
    );
  }

  // ✅ КРИТИЧНО: Проверяем NOT_FOUND ПЕРЕД UNAUTHORIZED
  // Backend возвращает NOT_FOUND когда пользователь не имеет доступа к заказу (security pattern)
  if (orderError && isNotFoundError(orderError)) {
    return (
      <CenteredPageLayout
        maxWidth="md"
        heading="404"
        title={tNotFound('title')}
        description={tNotFound('description')}
      >
        <Button asChild>
          <Link href={APP_ROUTES.HOME}>{tNotFound('goHome')}</Link>
        </Button>
      </CenteredPageLayout>
    );
  }

  // ✅ Если ошибка UNAUTHORIZED - показываем модалку
  if (orderError && isUnauthorizedError(orderError)) {
    return (
      <AuthErrorState
        error={orderError as Error & { data?: { code?: string } }}
        translations={{
          fetchFailed: t('errors.fetchFailed'),
          unauthorizedMessage: tErrors(UNAUTHORIZED_ERROR_KEY),
        }}
        onLoginRequired={onAuthRequired}
      />
    );
  }

  return (
    <>
      <OrderStatus
        orderId={orderId}
        showDetails={true}
        collapsibleTechnicalDetails={true}
        useOrderStatusHook={orderStatusHook}
        onMarkAsPaid={handleMarkAsPaid}
        onCancelOrder={handleCancelOrder}
      />
      <OrderDevTools
        orderId={orderId}
        orderData={undefined} // OrderDevTools получит данные через useOrderStatusHook
        trpcUtils={{
          setData: (key: { orderId: string }, updater: (oldData: unknown) => unknown) => {
            utils.exchange.getOrderStatus.setData(key, updater);
          },
        }}
      />
    </>
  );
}
