import { EXCHANGE_DEFAULTS } from '@repo/constants';
import type { Bank } from '@repo/exchange-core';
import { useMemo } from 'react';

import { useBanksForCurrency } from './useExchangeMutation';

/**
 * Custom hook for getting the default bank for UAH currency
 *
 * Centralizes the logic for finding the default bank (marked with isDefault: true)
 * from the UAH banks list to eliminate code duplication across components.
 *
 * Includes error boundaries and fallback mechanisms for API failures.
 *
 * @returns {Object} An object containing:
 *   - defaultBank: The default bank object or undefined if not found
 *   - isLoading: Boolean indicating if banks data is still loading
 *   - error: Error object if the query failed
 *   - fallbackBankId: Fallback bank ID when API fails (from constants)
 */
export function useDefaultBank() {
  const { data: uahBanks, isLoading, error } = useBanksForCurrency('UAH');

  const defaultBank = useMemo(() => {
    if (!uahBanks || !Array.isArray(uahBanks)) return undefined;
    return uahBanks.find((bank: Bank) => bank.isDefault);
  }, [uahBanks]);

  // ✅ ERROR BOUNDARY: Fallback mechanism when API fails
  const fallbackBankId = EXCHANGE_DEFAULTS.DEFAULT_BANK_ID;

  // ✅ ERROR BOUNDARY: Create fallback bank object when API fails but we need bank data
  const fallbackBank = useMemo((): Bank | undefined => {
    if (error && !defaultBank) {
      return {
        id: fallbackBankId,
        name: 'MonoBank', // Fallback name
        shortName: 'Mono',
        logoUrl: '',
        isActive: true,
        isDefault: true,
        priority: 1,
      };
    }
    return undefined;
  }, [error, defaultBank, fallbackBankId]);

  return {
    defaultBank: defaultBank || fallbackBank,
    isLoading,
    error,
    fallbackBankId,
    isUsingFallback: !!fallbackBank,
  };
}
