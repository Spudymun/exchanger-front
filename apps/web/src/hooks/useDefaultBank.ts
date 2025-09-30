import { useMemo } from 'react';

import { useBanksForCurrency } from './useExchangeMutation';

/**
 * Custom hook for getting the default bank for UAH currency
 *
 * Centralizes the logic for finding the default bank (marked with isDefault: true)
 * from the UAH banks list to eliminate code duplication across components.
 *
 * @returns {Object} An object containing:
 *   - defaultBank: The default bank object or undefined if not found
 *   - isLoading: Boolean indicating if banks data is still loading
 *   - error: Error object if the query failed
 */
export function useDefaultBank() {
  const { data: uahBanks, isLoading, error } = useBanksForCurrency('UAH');

  const defaultBank = useMemo(() => {
    if (!uahBanks || !Array.isArray(uahBanks)) return undefined;
    return uahBanks.find((bank: { isDefault?: boolean }) => bank.isDefault);
  }, [uahBanks]);

  return {
    defaultBank,
    isLoading,
    error,
  };
}
