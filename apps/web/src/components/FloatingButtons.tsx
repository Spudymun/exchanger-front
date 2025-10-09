'use client';

import { useScrollVisibility } from '@repo/hooks';
import { useRef, useEffect, useState } from 'react';

import { FloatingExchangeButton } from './FloatingExchangeButton';
import { FloatingSupportButton } from './FloatingSupportButton';

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
 * Контейнер для floating кнопок (обменник + поддержка)
 * Управляет позиционированием кнопок чтобы они не накладывались
 */
export function FloatingButtons() {
  const exchangeRef = useExchangeElementRef();

  const isExchangeVisible = useScrollVisibility(exchangeRef, {
    threshold: 0.1,
    rootMargin: '-100px 0px 0px 0px',
  });

  // Кнопка обменника видна только когда обменник НЕ виден
  const isExchangeButtonVisible = !isExchangeVisible;

  return (
    <>
      <FloatingExchangeButton />
      <FloatingSupportButton isExchangeButtonVisible={isExchangeButtonVisible} />
    </>
  );
}
