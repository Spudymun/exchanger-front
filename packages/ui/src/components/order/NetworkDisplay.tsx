'use client';

import { TOKEN_STANDARD_DETAILS, type TokenStandard } from '@repo/constants';
import { textStyles, combineStyles, CopyButton } from '@repo/ui';
import { Network, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface NetworkDisplayProps {
  tokenStandard: TokenStandard;
  /** Показать кнопку копирования */
  showCopy?: boolean;
  /** Показать расширенную информацию о сети */
  showDetails?: boolean;
  /** Дополнительные CSS классы */
  className?: string;
  /** Функция локализации - передается как проп */
  t: ReturnType<typeof useTranslations>;
}

// Компонент для отображения деталей сети
function NetworkDetailsContent({
  networkDetails,
  showCopy,
  t,
}: {
  networkDetails: { network: string; shortName: string };
  showCopy: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg p-2 group-hover:bg-accent/5 transition-colors">
      <div className="flex items-center gap-3">
        <Network className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <span className={combineStyles(textStyles.body.md, 'font-medium')}>
            {networkDetails.network}
          </span>
          <span className="px-2 py-1 text-xs border border-border rounded-md bg-muted">
            {networkDetails.shortName}
          </span>
        </div>
        {showCopy && (
          <CopyButton
            value={`${networkDetails.network} (${networkDetails.shortName})`}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            variant="ghost"
            size="sm"
            title={t('copyNetworkInfo')}
          />
        )}
      </div>
    </div>
  );
}

// Компонент для отображения дополнительной информации
function NetworkAdditionalInfo({
  networkDetails: _networkDetails,
  t: _t,
}: {
  networkDetails: { confirmations: number };
  t: ReturnType<typeof useTranslations>;
}) {
  return null; // Убираем лишний функционал который не просили
}

/**
 * Компонент для отображения выбранной сети токена
 */
export function NetworkDisplay({
  tokenStandard,
  showCopy = false,
  showDetails = false,
  className,
  t,
}: NetworkDisplayProps) {
  // Безопасный доступ к TOKEN_STANDARD_DETAILS
  const networkDetails =
    TOKEN_STANDARD_DETAILS[tokenStandard as keyof typeof TOKEN_STANDARD_DETAILS];

  if (!networkDetails) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Info className="h-4 w-4" />
        <span className={textStyles.body.sm}>Unknown network: {tokenStandard}</span>
      </div>
    );
  }

  return (
    <div className={combineStyles('group', className)}>
      <p className={textStyles.heading.sm}>{t('blockchainNetwork')}</p>

      <NetworkDetailsContent networkDetails={networkDetails} showCopy={showCopy} t={t} />

      {showDetails && <NetworkAdditionalInfo networkDetails={networkDetails} t={t} />}
    </div>
  );
}
