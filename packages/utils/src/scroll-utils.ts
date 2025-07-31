/**
 * Утилиты для работы со скроллом
 */

export interface ScrollToElementOptions {
    /** Поведение скролла */
    behavior?: ScrollBehavior;
    /** Выравнивание по вертикали */
    block?: ScrollLogicalPosition;
    /** Выравнивание по горизонтали */
    inline?: ScrollLogicalPosition;
    /** Дополнительный отступ сверху */
    offset?: number;
}

/**
 * Плавный скролл к элементу
 */
export function scrollToElement(
    element: HTMLElement | null,
    options: ScrollToElementOptions = {}
): void {
    if (!element) return;

    const {
        behavior = 'smooth',
        block = 'start',
        inline = 'nearest',
        offset = 0,
    } = options;

    if (offset === 0) {
        element.scrollIntoView({
            behavior,
            block,
            inline,
        });
    } else {
        // Если нужен offset, используем более точный метод
        const elementRect = element.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.scrollY; // Исправлено: scrollY вместо pageYOffset
        const targetPosition = absoluteElementTop - offset;

        window.scrollTo({
            top: targetPosition,
            behavior,
        });
    }
}

/**
 * Скролл к элементу по ref
 */
export function scrollToRef(
    elementRef: React.RefObject<HTMLElement | null>, // Исправлено: добавлен | null
    options?: ScrollToElementOptions
): void {
    scrollToElement(elementRef.current, options);
}