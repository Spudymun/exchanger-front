'use client';

import { SOCIAL_LINKS } from '@repo/constants';
import { MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

/**
 * Пропсы для FloatingSupportButton
 */
interface FloatingSupportButtonProps {
  /** Смещение, когда кнопка обменника видна (по умолчанию 120px влево от края) */
  offsetWhenExchangeVisible?: number;
  /** Смещение, когда кнопка обменника НЕ видна (по умолчанию 24px от края) */
  offsetWhenExchangeHidden?: number;
  /** Флаг видимости кнопки обменника */
  isExchangeButtonVisible?: boolean;
}

/**
 * Floating кнопка "Поддержка" которая всегда видна
 * Открывает Telegram бота для связи с поддержкой
 * 
 * Адаптивно меняет позицию в зависимости от видимости кнопки обменника:
 * - Когда кнопка обменника видна: смещается влево чтобы не накладываться
 * - Когда кнопка обменника скрыта: занимает позицию справа
 */
export function FloatingSupportButton({
  offsetWhenExchangeVisible = 120,
  offsetWhenExchangeHidden = 24,
  isExchangeButtonVisible = false,
}: FloatingSupportButtonProps) {
  const t = useTranslations('Layout');

  const handleClick = useCallback(() => {
    window.open(SOCIAL_LINKS.SUPPORT_TELEGRAM.href, '_blank', 'noopener,noreferrer');
  }, []);

  // Динамическое смещение: когда кнопка обменника не видна, 
  // кнопка поддержки может занять её место справа
  const rightOffset = isExchangeButtonVisible ? offsetWhenExchangeVisible : offsetWhenExchangeHidden;

  return (
    <div
      className="fixed transition-all duration-300 z-50"
      style={{
        bottom: '100px',
        right: `${rightOffset}px`,
      }}
    >
      <button
        onClick={handleClick}
        aria-label={t('footer.support.telegram')}
        className="w-16 h-16 rounded-full bg-[#0088cc] hover:bg-[#0077b5] text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center border-0 cursor-pointer"
      >
        <MessageCircle className="w-8 h-8" fill="white" stroke="white" strokeWidth={1.5} />
      </button>
    </div>
  );
}
