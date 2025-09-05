'use client';

import { ORDER_STATUSES, type OrderStatus } from '@repo/constants';
import { orderManager } from '@repo/exchange-core';
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  cardStyles,
  textStyles,
  combineStyles,
} from '@repo/ui';
import { RotateCcw } from 'lucide-react';
import React, { useState } from 'react';

// ИСПРАВЛЕНО: OrderDevTools теперь получает trpc utils как проп для избежания coupling
export interface PublicOrderData {
  id: string;
  status: OrderStatus;
  cryptoAmount: number;
  uahAmount: number;
  currency: string;
  depositAddress: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  txHash?: string;
}

interface OrderDevToolsProps {
  orderId: string;
  // ДОБАВЛЕНО: Внешние зависимости передаются как пропы
  orderData?: PublicOrderData;
  trpcUtils?: {
    setData: (key: { orderId: string }, updater: (oldData: unknown) => unknown) => void;
  };
}

export function OrderDevTools({ orderId, orderData, trpcUtils }: OrderDevToolsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!orderData) {
    return null;
  }

  const handleStatusChange = async (newStatus: OrderStatus) => {
    try {
      // Prepare update data
      const updateData: Parameters<typeof orderManager.update>[1] = { status: newStatus };

      // Add additional data for completed orders
      if (newStatus === ORDER_STATUSES.COMPLETED) {
        updateData.txHash = `dev_tx_${Date.now()}`;
        updateData.processedAt = new Date();
      }

      // Update local mock data (for development testing)
      orderManager.update(orderId, updateData);

      // Force update React Query cache with new data (modern dev tools pattern)
      if (trpcUtils) {
        trpcUtils.setData({ orderId }, oldData => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            status: newStatus,
            updatedAt: new Date(),
            ...(newStatus === ORDER_STATUSES.COMPLETED && {
              txHash: updateData.txHash,
              processedAt: updateData.processedAt,
            }),
          };
        });
      }
    } catch {
      // Silent fail in development
    }
  };

  return (
    <ExpandedDevTools
      isExpanded={isExpanded}
      onToggleExpand={setIsExpanded}
      orderData={orderData}
      onStatusChange={handleStatusChange}
    />
  );
}

// Main expanded component
function ExpandedDevTools({
  isExpanded,
  onToggleExpand,
  orderData,
  onStatusChange,
}: {
  isExpanded: boolean;
  onToggleExpand: (expanded: boolean) => void;
  orderData: PublicOrderData;
  onStatusChange: (status: OrderStatus) => void;
}) {
  if (!isExpanded) {
    return <CollapsedDevTools onExpand={() => onToggleExpand(true)} />;
  }

  return (
    <Card className={combineStyles(cardStyles.base, 'border-yellow-200 bg-yellow-50 mt-4')}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className={textStyles.heading.sm}>🛠️ Development Tools</h3>
          <Button onClick={() => onToggleExpand(false)} variant="ghost" size="sm">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Status */}
        <div>
          <p className={combineStyles(textStyles.body.sm, 'text-gray-600 mb-2')}>
            Текущий статус: <span className="font-medium">{orderData.status}</span>
          </p>
        </div>

        <StatusControls orderData={orderData} onStatusChange={onStatusChange} />

        {/* Warning */}
        <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-700">
          ⚠️ Инструменты разработки. Не отображаются в production.
        </div>
      </CardContent>
    </Card>
  );
}

// Collapsed view component
function CollapsedDevTools({ onExpand }: { onExpand: () => void }) {
  return (
    <Card className={combineStyles(cardStyles.base, 'border-yellow-200 bg-yellow-50 mt-4 p-3')}>
      <div className="flex items-center justify-between">
        <span className={textStyles.body.sm}>🛠️ Development Tools</span>
        <Button onClick={onExpand} variant="ghost" size="sm">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

// Status controls component
function StatusControls({
  orderData,
  onStatusChange,
}: {
  orderData: PublicOrderData;
  onStatusChange: (status: OrderStatus) => void;
}) {
  const allStatuses = Object.values(ORDER_STATUSES);

  return (
    <div className="space-y-2">
      <p className={textStyles.body.sm}>Изменить статус на:</p>
      <div className="grid grid-cols-2 gap-2">
        {allStatuses.map(status => (
          <Button
            key={status}
            onClick={() => onStatusChange(status)}
            disabled={orderData.status === status}
            variant={orderData.status === status ? 'secondary' : 'outline'}
            size="sm"
          >
            {status === orderData.status ? '✓ ' : ''}
            {status}
          </Button>
        ))}
      </div>
    </div>
  );
}
