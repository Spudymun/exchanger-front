'use client';

import type { CreateOrderRequest } from '@repo/exchange-core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { trpc } from '../../lib/trpc-provider';

interface CreateOrderResponse {
  orderId: string;
  depositAddress: string;
  cryptoAmount: number;
  uahAmount: number;
  currency: string;
  status: string;
  createdAt: Date;
}

interface OrderStatusResponse {
  id: string;
  status: string;
  cryptoAmount: number;
  uahAmount: number;
  currency: string;
  depositAddress: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  txHash?: string;
}

interface UseExchangeMutationOptions {
  onSuccess?: (order: CreateOrderResponse | OrderStatusResponse) => void;
  // Following project architecture - error handling through React Query mechanism
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError?: (error: any) => void;
}

export function useExchangeMutation(options?: UseExchangeMutationOptions) {
  const queryClient = useQueryClient();
  const createOrderMutation = trpc.exchange.createOrder.useMutation();
  const utils = trpc.useUtils();

  const createOrder = useMutation({
    mutationFn: async (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
      return await createOrderMutation.mutateAsync(data);
    },
    onSuccess: order => {
      // Инвалидируем кэш курсов валют для обновления
      queryClient.invalidateQueries({ queryKey: ['exchange.getRates'] });

      // Инвалидируем кэш заказов пользователя
      queryClient.invalidateQueries({ queryKey: ['exchange.getOrderHistory'] });

      options?.onSuccess?.(order);
    },
    onError: error => {
      // Following project architecture - error passed as-is to callback
      options?.onError?.(error);
    },
  });

  const getOrderStatus = useMutation({
    mutationFn: async (orderId: string): Promise<OrderStatusResponse> => {
      return await utils.exchange.getOrderStatus.fetch({ orderId });
    },
    onSuccess: order => {
      // Обновляем кэш для конкретного заказа
      queryClient.setQueryData(['exchange.getOrderStatus', { orderId: order.id }], order);

      // Обновляем кэш списка заказов
      queryClient.invalidateQueries({ queryKey: ['exchange.getOrderHistory'] });
    },
    onError: error => {
      // Following project architecture - error passed as-is to callback
      options?.onError?.(error);
    },
  });

  return {
    createOrder,
    getOrderStatus,
    isLoading: createOrder.isPending || getOrderStatus.isPending,
    isCreatingOrder: createOrder.isPending,
    isCheckingStatus: getOrderStatus.isPending,
  };
}

// Centralized hook for getting exchange rates
export function useExchangeRates(): ReturnType<typeof trpc.exchange.getRates.useQuery> {
  return trpc.exchange.getRates.useQuery(undefined, {
    refetchInterval: 30000, // Update every 30 seconds
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

// Centralized hook for getting supported currencies from database
export function useSupportedCurrencies(): ReturnType<typeof trpc.exchange.getSupportedCurrencies.useQuery> {
  return trpc.exchange.getSupportedCurrencies.useQuery(undefined, {
    staleTime: 300000, // 5 minutes cache
    refetchOnWindowFocus: false,
  });
}

// ✅ ДОБАВЛЕНО: Хук для получения сетей токенов из базы данных
export function useSupportedTokenStandards(): ReturnType<typeof trpc.exchange.getSupportedTokenStandards.useQuery> {
  return trpc.exchange.getSupportedTokenStandards.useQuery(undefined, {
    staleTime: 300000, // 5 minutes cache
    refetchOnWindowFocus: false,
  });
}

// Centralized hook for getting order status
export function useOrderStatus(
  orderId: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number | ((data: unknown) => number | false);
  }
): ReturnType<typeof trpc.exchange.getOrderStatus.useQuery> {
  return trpc.exchange.getOrderStatus.useQuery(
    { orderId },
    {
      enabled: options?.enabled ?? !!orderId,
      refetchInterval: options?.refetchInterval,
    }
  );
}

export type UseExchangeMutationReturn = ReturnType<typeof useExchangeMutation>;
