import { PERCENTAGE_CALCULATIONS } from '@repo/constants';

/**
 * Unified calculation utilities to eliminate logic duplication
 * Centralizes commission calculation logic from exchange-core utils
 */

/**
 * Calculate commission amount from gross amount and commission rate
 * Eliminates duplication between calculateUahAmount and calculateCommission
 */
export function calculateCommissionAmount(grossAmount: number, commissionRate: number): number {
  return grossAmount * (commissionRate / PERCENTAGE_CALCULATIONS.PERCENT_BASE);
}

/**
 * Calculate net amount after commission deduction
 */
export function calculateNetAmount(grossAmount: number, commissionRate: number): number {
  const commissionAmount = calculateCommissionAmount(grossAmount, commissionRate);
  return grossAmount - commissionAmount;
}

/**
 * Calculate gross amount from net amount (reverse calculation)
 */
export function calculateGrossAmountFromNet(netAmount: number, commissionRate: number): number {
  // Formula: netAmount = grossAmount * (1 - commissionRate/100)
  // Therefore: grossAmount = netAmount / (1 - commissionRate/100)
  return netAmount / (1 - commissionRate / PERCENTAGE_CALCULATIONS.PERCENT_BASE);
}

/**
 * Calculate commission rate as percentage for display
 */
export function formatCommissionRate(commissionRate: number): string {
  return `${commissionRate}%`;
}
