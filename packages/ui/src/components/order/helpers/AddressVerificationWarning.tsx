'use client';

import { EMAIL_SENDING_CONFIG, type Environment } from '@repo/constants';
import { Notification } from '@repo/ui';
import { useTranslations } from 'next-intl';

/**
 * Определение текущего окружения из NODE_ENV
 * @returns Окружение приложения (используем тип Environment из @repo/constants)
 */
function getEnvironment(): Environment {
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv === 'production') return 'production';
  if (nodeEnv === 'development') return 'development';

  // По умолчанию staging для тестирования
  return 'staging';
}

/**
 * Компонент предупреждения о необходимости проверки crypto адреса
 *
 * @description Отображается на странице заказа рядом с deposit address.
 * Показывается ТОЛЬКО когда email с адресом отправляется пользователю
 * (использует EMAIL_SENDING_CONFIG.BY_TYPE.CRYPTO_ADDRESS для определения).
 *
 * @rationale Если email не отправляется, то нет смысла показывать warning
 * о проверке адреса в email, которого нет.
 *
 * @component
 * @example
 * ```tsx
 * <AddressVerificationWarning />
 * ```
 */
export function AddressVerificationWarning() {
  const t = useTranslations('OrderStatus');

  // Определяем окружение
  const environment = getEnvironment();

  // Проверяем отправляется ли email с crypto адресом в текущем окружении
  // ВАЖНО: учитываем И глобальный выключатель, И конфигурацию по типу
  const globalEnabled = EMAIL_SENDING_CONFIG.GLOBAL_ENABLED;
  const cryptoAddressConfig = EMAIL_SENDING_CONFIG.BY_TYPE.CRYPTO_ADDRESS;

  let isGlobalEnabled = false;
  let isCryptoAddressEnabled = false;

  if (environment === 'development') {
    isGlobalEnabled = globalEnabled.development;
    isCryptoAddressEnabled = cryptoAddressConfig.development;
  } else if (environment === 'staging') {
    isGlobalEnabled = globalEnabled.staging;
    isCryptoAddressEnabled = cryptoAddressConfig.staging;
  } else if (environment === 'production') {
    isGlobalEnabled = globalEnabled.production;
    isCryptoAddressEnabled = cryptoAddressConfig.production;
  }

  // Email отправляется ТОЛЬКО если глобально включен И для этого типа включен
  const isEmailEnabled = isGlobalEnabled && isCryptoAddressEnabled;

  // Если email не отправляется - не показываем warning
  if (!isEmailEnabled) {
    return null;
  }

  return (
    <Notification
      variant="warning"
      title={t('addressVerificationWarning.title')}
      description={t('addressVerificationWarning.description')}
      showIcon={true}
      closable={false}
      className="border-2"
    />
  );
}
