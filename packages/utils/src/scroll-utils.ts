/**
 * Утилиты для работы со скроллом
 * @module scroll-utils
 * @see CODE_STYLE_GUIDE.md - архитектурные принципы для utils
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
 * Плавный скролл к элементу с поддержкой offset
 *
 * @param element - HTML элемент для скролла (может быть null)
 * @param options - Опции скролла с дефолтными значениями
 *
 * @example
 * ```typescript
 * // Простой скролл
 * scrollToElement(document.getElementById('target'));
 *
 * // С отступом и анимацией
 * scrollToElement(element, {
 *   offset: 80,
 *   behavior: 'smooth',
 *   block: 'center'
 * });
 * ```
 *
 * @since 1.0.0
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
 */
export function scrollToElement(
  element: HTMLElement | null,
  options: ScrollToElementOptions = {}
): void {
  if (!element) return;

  const { behavior = 'smooth', block = 'start', inline = 'nearest', offset = 0 } = options;

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
 * Скролл к элементу по React ref
 *
 * Convenience wrapper для scrollToElement с поддержкой React refs.
 * Автоматически извлекает current элемент из ref.
 *
 * @param elementRef - React ref объект с HTML элементом
 * @param options - Опции скролла (передаются в scrollToElement)
 *
 * @example
 * ```typescript
 * const headerRef = useRef<HTMLDivElement>(null);
 *
 * // Скролл к header с отступом под fixed навигацию
 * const scrollToHeader = () => {
 *   scrollToRef(headerRef, {
 *     offset: 60,
 *     behavior: 'smooth'
 *   });
 * };
 * ```
 *
 * @since 1.0.0
 */
export function scrollToRef(
  elementRef: React.RefObject<HTMLElement | null>, // Исправлено: добавлен | null
  options?: ScrollToElementOptions
): void {
  scrollToElement(elementRef.current, options);
}
