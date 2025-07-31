'use client';

import { useScrollVisibility } from '@repo/hooks';
import { FloatingActionButton } from '@repo/ui';
import { scrollToRef } from '@repo/utils';
import { useTranslations } from 'next-intl';
import { useRef, useEffect, useState } from 'react';

// Константы для анимации
const PULSE_DELAY_MS = 2000; // Задержка перед началом анимации привлечения внимания

// Тип анимации - легко меняется для тестирования разных частот:
// 'slow'      - 3s, opacity: 1 → 0.6 (медленная, ненавязчивая)
// 'normal'    - 2s, opacity: 1 → 0.7 (стандартная)  
// 'fast'      - 1s, opacity: 1 → 0.8 (быстрая, активная)
// 'attention' - 2.5s, opacity + scale (привлекающая внимание)
const PULSE_TYPE = 'slow' as const;

/**
 * Floating кнопка "Обменять" которая появляется при скролле
 * когда основной обменник пропадает из виду
 */
export function FloatingExchangeButton() {
    const t = useTranslations('HomePage.exchangeCalculator');
    const exchangeRef = useRef<HTMLElement | null>(null);

    // Состояние для принудительного обновления hook (не используется напрямую, но нужно для ре-рендера)
    const [, setElementFound] = useState(false);

    // Состояние для управления анимацией привлечения внимания
    const [shouldPulse, setShouldPulse] = useState(false);

    // Отслеживаем видимость обменника
    const isExchangeVisible = useScrollVisibility(exchangeRef, {
        threshold: 0.1,
        rootMargin: '-100px 0px 0px 0px', // Кнопка появляется когда обменник скрылся на 100px
    });

    // Управление анимацией привлечения внимания
    useEffect(() => {
        if (!isExchangeVisible) {
            // Включаем анимацию через заданную задержку после появления кнопки
            const pulseTimer = setTimeout(() => {
                setShouldPulse(true);
            }, PULSE_DELAY_MS);

            return () => clearTimeout(pulseTimer);
        } else {
            // Выключаем анимацию когда обменник снова видим
            setShouldPulse(false);
        }
    }, [isExchangeVisible]);

    // Находим элемент обменника на странице
    useEffect(() => {
        const findExchangeElement = () => {
            // Ищем обменник по data-testid или классу
            const exchangeElement = document.querySelector('[data-testid="hero-exchange-form"]') as HTMLElement ||
                document.querySelector('.hero-exchange-form') as HTMLElement ||
                // Fallback - ищем по структуре (форма внутри hero секции)
                document.querySelector('section form') as HTMLElement;

            if (exchangeElement) {
                exchangeRef.current = exchangeElement;
                setElementFound(true);
                return true;
            }
            return false;
        };

        // Пытаемся найти элемент сразу
        if (!findExchangeElement()) {
            // Если не найден, пытаемся через небольшую задержку (для hydration)
            const timeoutId = setTimeout(() => {
                if (findExchangeElement()) {
                    setElementFound(true);
                }
            }, 100);

            return () => clearTimeout(timeoutId);
        }
    }, []);

    const handleScrollToExchange = () => {
        // Отключаем анимацию при клике
        setShouldPulse(false);

        scrollToRef(exchangeRef, {
            behavior: 'smooth',
            block: 'center',
            offset: 100, // Отступ сверху для лучшей видимости
        });
    };

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