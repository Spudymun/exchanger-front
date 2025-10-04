'use client';

import * as React from 'react';

import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';

export interface OrderActionsProps {
  /** Callback для кнопки "Оплатил" */
  onMarkAsPaid: () => void;
  /** Callback для кнопки "Отменить заказ" */
  onCancelOrder: () => void;
  /** Состояние загрузки */
  isLoading?: boolean;
  /** Дополнительные CSS классы */
  className?: string;
  /** Тексты для кнопок (для локализации) */
  labels: {
    markAsPaid: string;
    cancelOrder: string;
    cancelConfirmTitle: string;
    cancelConfirmMessage: string;
    confirmCancel: string;
    cancelAction: string;
  };
}

/**
 * Компонент действий пользователя для активного заказа
 * - Кнопка "Оплатил"
 * - Кнопка "Отменить заказ" с подтверждением через модальное окно
 *
 * @example
 * ```tsx
 * <OrderActions
 *   onMarkAsPaid={() => console.log('Marked as paid')}
 *   onCancelOrder={() => console.log('Order cancelled')}
 *   labels={{
 *     markAsPaid: t('actions.markAsPaid'),
 *     cancelOrder: t('actions.cancelOrder'),
 *     // ...
 *   }}
 * />
 * ```
 */
export function OrderActions({
  onMarkAsPaid,
  onCancelOrder,
  isLoading = false,
  className,
  labels,
}: OrderActionsProps) {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false);

  const handleCancelConfirm = () => {
    onCancelOrder();
    setIsCancelDialogOpen(false);
  };

  return (
    <>
      <div className={className}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={onMarkAsPaid} disabled={isLoading} className="flex-1" size="lg">
            {labels.markAsPaid}
          </Button>
          <Button
            onClick={() => setIsCancelDialogOpen(true)}
            disabled={isLoading}
            variant="destructive"
            className="flex-1"
            size="lg"
          >
            {labels.cancelOrder}
          </Button>
        </div>
      </div>

      {/* Модальное окно подтверждения отмены */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{labels.cancelConfirmTitle}</DialogTitle>
            <DialogDescription>{labels.cancelConfirmMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              {labels.cancelAction}
            </Button>
            <Button variant="destructive" onClick={handleCancelConfirm}>
              {labels.confirmCancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
