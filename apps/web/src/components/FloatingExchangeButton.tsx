'use client';

import { useScrollVisibility } from '@repo/hooks';
import { FloatingActionButton } from '@repo/ui';
import { scrollToRef } from '@repo/utils';
import { useTranslations } from 'next-intl';
import { useRef, useEffect, useState, useCallback } from 'react';

// Константы для анимации
const PULSE_DELAY_MS = 2000; // Задержка перед началом анимации привлечения внимания
const PULSE_TYPE = 'attention' as const;

/**
 * Хук для поиска элемента обменника на странице
 */
function useExchangeElementRef() {
  const exchangeRef = useRef<HTMLElement | null>(null);
  const [, setElementFound] = useState(false);

  useEffect(() => {
    const findExchangeElement = () => {
      const exchangeElement =
        (document.querySelector('[data-testid="hero-exchange-form"]') as HTMLElement) ||
        (document.querySelector('.hero-exchange-form') as HTMLElement) ||
        (document.querySelector('section form') as HTMLElement);

      if (exchangeElement) {
        exchangeRef.current = exchangeElement;
        setElementFound(true);
        return true;
      }
      return false;
    };

    if (!findExchangeElement()) {
      const timeoutId = setTimeout(() => {
        if (findExchangeElement()) {
          setElementFound(true);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, []);

  return exchangeRef;
}

/**
 * Хук для управления анимацией привлечения внимания
 */
function usePulseAnimation(isVisible: boolean) {
  const [shouldPulse, setShouldPulse] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      const pulseTimer = setTimeout(() => {
        setShouldPulse(true);
      }, PULSE_DELAY_MS);

      return () => clearTimeout(pulseTimer);
    } else {
      setShouldPulse(false);
    }
  }, [isVisible]);

  return { shouldPulse, setShouldPulse };
}

/**
 * Floating кнопка "Обменять" которая появляется при скролле
 * когда основной обменник пропадает из виду
 */
export function FloatingExchangeButton() {
  const t = useTranslations('HomePage.exchangeCalculator');
  const exchangeRef = useExchangeElementRef();

  const isExchangeVisible = useScrollVisibility(exchangeRef, {
    threshold: 0.1,
    rootMargin: '-100px 0px 0px 0px',
  });

  const { shouldPulse, setShouldPulse } = usePulseAnimation(isExchangeVisible);

  const handleScrollToExchange = useCallback(() => {
    setShouldPulse(false);
    scrollToRef(exchangeRef, {
      behavior: 'smooth',
      block: 'center',
      offset: 100,
    });
  }, [exchangeRef, setShouldPulse]);

  return (
    <FloatingActionButton
      show={!isExchangeVisible}
      position="bottom-right"
      offset={{ bottom: 24, right: 24 }}
      onClick={handleScrollToExchange}
      variant="default"
      size="lg"
      className="shadow-lg hover:shadow-xl"
      pulse={shouldPulse}
      pulseType={PULSE_TYPE}
    >
      {t('exchange')}
    </FloatingActionButton>
  );
}
