import { useEffect } from 'react';

import { useUIStore } from '../state/ui-store';

/**
 * Enhanced Button Hook for Loading States
 * 
 * Утилитарный хук для упрощения работы с расширенным AuthSubmitButton.
 * Предоставляет интеграцию с tRPC mutations и глобальным отслеживанием состояний.
 * 
 * @example
 * ```tsx
 * const createOrder = trpc.exchange.createOrder.useMutation();
 * 
 * const buttonConfig = useEnhancedButton({
 *   mutation: createOrder,
 *   loadingId: 'exchange-submit'
 * });
 * 
 * return (
 *   <AuthSubmitButton
 *     {...buttonConfig}
 *     submitStyle="exchange"
 *   >
 *     Create Order
 *   </AuthSubmitButton>
 * );
 * ```
 */

export interface UseEnhancedButtonOptions {
  /**
   * tRPC mutation object with isPending state
   */
  mutation?: { isPending: boolean };
  
  /**
   * Unique ID for global loading state tracking
   */
  loadingId?: string;
  
  /**
   * Whether to show spinner during loading
   * @default true
   */
  showSpinner?: boolean;
  
  /**
   * Position of the spinner relative to button text
   * @default 'left'
   */
  spinnerPosition?: 'left' | 'right' | 'center';
  
  /**
   * Size of the spinner
   * @default 'sm'
   */
  spinnerSize?: 'xs' | 'sm' | 'base';
  
  /**
   * Visual variant of the spinner
   * @default 'default'
   */
  spinnerVariant?: 'default' | 'secondary' | 'muted' | 'accent';
  
  /**
   * Whether to preserve button width during loading
   * @default true
   */
  preserveWidth?: boolean;
}

export interface UseEnhancedButtonReturn {
  /**
   * Loading state (from mutation or manual control)
   */
  isLoading: boolean;
  
  /**
   * Whether to show spinner
   */
  showSpinner: boolean;
  
  /**
   * Spinner position
   */
  spinnerPosition: 'left' | 'right' | 'center';
  
  /**
   * Spinner size
   */
  spinnerSize: 'xs' | 'sm' | 'base';
  
  /**
   * Spinner variant
   */
  spinnerVariant: 'default' | 'secondary' | 'muted' | 'accent';
  
  /**
   * Whether to preserve width
   */
  preserveWidth: boolean;
}

export function useEnhancedButton(
  options: UseEnhancedButtonOptions = {}
): UseEnhancedButtonReturn {
  const { setButtonLoading } = useUIStore();
  
  const {
    mutation,
    loadingId,
    showSpinner = true,
    spinnerPosition = 'left',
    spinnerSize = 'sm',
    spinnerVariant = 'default',
    preserveWidth = true,
  } = options;

  // Sync mutation loading state with global state
  useEffect(() => {
    if (loadingId && mutation) {
      setButtonLoading(loadingId, mutation.isPending);
      
      // Cleanup on unmount
      return () => setButtonLoading(loadingId, false);
    }
  }, [loadingId, mutation?.isPending, setButtonLoading]);

  return {
    isLoading: mutation?.isPending || false,
    showSpinner,
    spinnerPosition,
    spinnerSize,
    spinnerVariant,
    preserveWidth,
  };
}