import { MOCK_CRYPTO_ADDRESSES, VALIDATION_BOUNDS, CRYPTOCURRENCIES } from '@repo/constants';

import type { CryptoCurrency } from '../types';

/**
 * Service for generating crypto addresses
 * Moved from crypto.ts to eliminate side effects from utils layer
 */
export class CryptoAddressGenerationService {
  /**
   * Validate currency and get addresses safely
   */
  private getAddressesForCurrency(currency: CryptoCurrency): readonly string[] {
    if (!CRYPTOCURRENCIES.includes(currency)) {
      throw new Error(`Invalid currency: ${currency}`);
    }

    switch (currency) {
      case 'BTC':
        return MOCK_CRYPTO_ADDRESSES.BTC;
      case 'ETH':
        return MOCK_CRYPTO_ADDRESSES.ETH;
      case 'USDT':
        return MOCK_CRYPTO_ADDRESSES.USDT;
      case 'LTC':
        return MOCK_CRYPTO_ADDRESSES.LTC;
      default:
        throw new Error(`Unsupported currency: ${currency}`);
    }
  }

  /**
   * Select random address from array
   */
  private selectRandomAddress(addresses: readonly string[], currency: CryptoCurrency): string {
    if (!addresses || addresses.length === VALIDATION_BOUNDS.MIN_VALUE) {
      throw new Error(`No mock addresses available for currency: ${currency}`);
    }

    const randomIndex = Math.floor(Math.random() * addresses.length);
    // Safe array access with explicit index check
    if (randomIndex >= addresses.length || randomIndex < VALIDATION_BOUNDS.MIN_VALUE) {
      throw new Error(`Invalid random index ${randomIndex} for currency: ${currency}`);
    }

    // Safe array access using Array.at() to prevent object injection
    const selectedAddress = addresses.at(randomIndex);
    if (!selectedAddress) {
      throw new Error(`Empty address at index ${randomIndex} for currency: ${currency}`);
    }

    return selectedAddress;
  }

  /**
   * Generate random deposit address for testing purposes
   * Note: This is a mock implementation for development
   */
  generateDepositAddress(currency: CryptoCurrency): string {
    const addresses = this.getAddressesForCurrency(currency);
    return this.selectRandomAddress(addresses, currency);
  }

  /**
   * Generate new wallet address (placeholder for future implementation)
   */
  generateNewWalletAddress(currency: CryptoCurrency): string {
    // This would integrate with actual wallet generation in production
    return this.generateDepositAddress(currency);
  }
}

// Export convenience function for backward compatibility
const cryptoAddressService = new CryptoAddressGenerationService();

export function generateCryptoDepositAddress(currency: CryptoCurrency): string {
  return cryptoAddressService.generateDepositAddress(currency);
}
