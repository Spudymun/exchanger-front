'use client';

import type { CreateOrderRequest } from '@repo/exchange-core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TRPCError } from '@trpc/server';

import { trpc } from '../../lib/trpc';

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
  onError?: (error: TRPCError) => void;
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
      options?.onError?.(error as TRPCError);
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
      options?.onError?.(error as TRPCError);
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

// Centralized hook for getting order status
export function useOrderStatus(
  orderId: string,
  options?: { enabled?: boolean; refetchInterval?: number }
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
