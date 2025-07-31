'use client';

import { useEffect, useState } from 'react';

export interface UseScrollVisibilityOptions {
    /** Порог видимости (0-1) */
    threshold?: number;
    /** Отступы для root элемента */
    rootMargin?: string;
    /** Root элемент для наблюдения */
    root?: Element | null;
}

/**
 * Hook для отслеживания видимости элемента при скролле
 * Использует Intersection Observer API
 */
export function useScrollVisibility(
    elementRef: React.RefObject<HTMLElement | null>,
    options: UseScrollVisibilityOptions = {}
): boolean {
    const [isVisible, setIsVisible] = useState(true); // Начальное состояние - видимый
    const { threshold = 0, rootMargin = '0px', root = null } = options;

    useEffect(() => {
        const element = elementRef.current;
        if (!element) {
            // Если элемент не найден, считаем его видимым (кнопка не показывается)
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry) {
                    setIsVisible(entry.isIntersecting);
                }
            },
            {
                threshold,
                rootMargin,
                root,
            }
        );

        observer.observe(element);

        return () => {
            observer.unobserve(element);
        };
    }, [elementRef.current, threshold, rootMargin, root]); // Добавлена зависимость от elementRef.current

    return isVisible;
}