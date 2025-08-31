'use client';

import { useCallback, useState } from 'react';

export interface UseCopyToClipboardOptions {
  /** Длительность показа success состояния в миллисекундах */
  successDuration?: number;
  /** Callback при успешном копировании */
  onSuccess?: (value: string) => void;
  /** Callback при ошибке */
  onError?: (error: Error) => void;
}

export interface UseCopyToClipboardReturn {
  /** Состояние успешного копирования */
  isCopied: boolean;
  /** Состояние загрузки */
  isLoading: boolean;
  /** Ошибка копирования */
  error: Error | null;
  /** Функция копирования */
  copy: (value: string) => Promise<void>;
  /** Сброс состояния */
  reset: () => void;
}

/**
 * Hook для копирования текста в буфер обмена
 *
 * Предоставляет полный контроль над процессом копирования с:
 * - Визуальной обратной связью (loading, success, error)
 * - Автоматическим сбросом состояния после timeout
 * - Обработкой ошибок и fallback для неподдерживаемых браузеров
 * - Callback'ами для кастомной логики
 *
 * @example
 * ```tsx
 * function CopyableText({ text }: { text: string }) {
 *   const { isCopied, isLoading, copy } = useCopyToClipboard({
 *     successDuration: 2000,
 *     onSuccess: (value) => console.log('Copied:', value)
 *   });
 *
 *   return (
 *     <button onClick={() => copy(text)} disabled={isLoading}>
 *       {isLoading ? 'Copying...' : isCopied ? 'Copied!' : 'Copy'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {}
): UseCopyToClipboardReturn {
  const { successDuration = 2000, onSuccess, onError } = options;

  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copy = useCallback(
    async (value: string) => {
      if (!navigator.clipboard) {
        const err = new Error('Clipboard not supported in this browser');
        setError(err);
        onError?.(err);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        await navigator.clipboard.writeText(value);

        setIsCopied(true);
        onSuccess?.(value);

        setTimeout(() => setIsCopied(false), successDuration);
      } catch (err) {
        const error = err as Error;
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [successDuration, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setIsCopied(false);
    setIsLoading(false);
    setError(null);
  }, []);

  return { isCopied, isLoading, error, copy, reset };
}
