'use client';

import { ORDER_EXPIRATION_TIME_MS } from '@repo/constants';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import { cn } from '../../lib/utils';

export interface CountdownTimerProps {
  /** Дата создания заказа */
  createdAt: Date;
  /** Дополнительные CSS классы */
  className?: string;
  /** Callback при истечении времени */
  onExpired?: () => void;
}

interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isWarning: boolean; // < 10 минут
}

/**
 * Компонент обратного отсчета времени до истечения заказа
 *
 * @example
 * ```tsx
 * <CountdownTimer
 *   createdAt={order.createdAt}
 *   onExpired={() => console.log('Order expired')}
 * />
 * ```
 */
export function CountdownTimer({ createdAt, className, onExpired }: CountdownTimerProps) {
  const t = useTranslations('OrderStatus');
  const [timeRemaining, setTimeRemaining] = React.useState<TimeRemaining>(() =>
    calculateTimeRemaining(createdAt)
  );

  React.useEffect(() => {
    // Обновление каждую секунду
    const intervalId = setInterval(() => {
      const remaining = calculateTimeRemaining(createdAt);
      setTimeRemaining(remaining);

      // Callback при истечении времени
      if (remaining.isExpired && onExpired) {
        onExpired();
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [createdAt, onExpired]);

  const { hours, minutes, seconds, isExpired, isWarning } = timeRemaining;

  if (isExpired) {
    return (
      <div className={cn('rounded-lg border border-destructive bg-destructive/10 p-4', className)}>
        <p className="text-sm font-medium text-destructive">{t('countdown.expired')}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        isWarning ? 'border-destructive bg-destructive/10' : 'border-border bg-muted/50',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground flex-1">{t('countdown.warning')}</p>
        <div
          className={cn(
            'text-3xl font-mono font-bold tabular-nums flex-shrink-0',
            isWarning ? 'text-destructive' : 'text-foreground'
          )}
          role="timer"
          aria-live="polite"
        >
          {formatTime(hours)}:{formatTime(minutes)}:{formatTime(seconds)}
        </div>
      </div>
    </div>
  );
}

/**
 * Рассчитывает оставшееся время до истечения заказа
 */
function calculateTimeRemaining(createdAt: Date): TimeRemaining {
  const now = new Date();
  const expiresAt = new Date(createdAt.getTime() + ORDER_EXPIRATION_TIME_MS);
  const diff = expiresAt.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      isWarning: false,
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const SECONDS_IN_HOUR = 3600;
  const SECONDS_IN_MINUTE = 60;
  const WARNING_THRESHOLD_SECONDS = 600; // 10 минут

  const hours = Math.floor(totalSeconds / SECONDS_IN_HOUR);
  const minutes = Math.floor((totalSeconds % SECONDS_IN_HOUR) / SECONDS_IN_MINUTE);
  const seconds = totalSeconds % SECONDS_IN_MINUTE;

  // Предупреждение если осталось < 10 минут
  const isWarning = totalSeconds < WARNING_THRESHOLD_SECONDS;

  return {
    hours,
    minutes,
    seconds,
    isExpired: false,
    isWarning,
  };
}

/**
 * Форматирует число в двухзначную строку (00, 01, 02, ...)
 */
function formatTime(value: number): string {
  return value.toString().padStart(2, '0');
}
