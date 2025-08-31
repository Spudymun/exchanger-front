import * as React from 'react';

import { combineStyles, layoutStyles, pageStyles } from '../lib/shared-styles';

export interface PageLayoutProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Заголовок страницы (опционально)
   */
  title?: string;
  /**
   * Дополнительные стили для контейнера
   */
  containerClassName?: string;
  /**
   * Вариант отступов контейнера
   */
  padding?: 'none' | 'default' | 'large';
  /**
   * Включить responsive padding (px-4 lg:px-0)
   */
  responsivePadding?: boolean;
  children: React.ReactNode;
}

/**
 * PageLayout Component
 *
 * Универсальный layout компонент для страниц:
 * - Использует существующие shared-styles (layoutStyles, pageStyles)
 * - Устраняет дублирование layout кода между страницами
 * - Поддерживает responsive patterns из design tokens
 * - Интегрируется с AppLayout для полного layout решения
 *
 * @example
 * ```tsx
 * <PageLayout title="Exchange Page">
 *   <ExchangeContainer />
 * </PageLayout>
 * ```
 */
export const PageLayout = React.forwardRef<HTMLElement, PageLayoutProps>(
  (
    {
      className,
      title,
      containerClassName,
      padding = 'default',
      responsivePadding = true,
      children,
      ...props
    },
    ref
  ) => {
    const getPaddingClass = (p: typeof padding) => {
      switch (p) {
        case 'none':
          return '';
        case 'large':
          return 'py-12 lg:py-16';
        case 'default':
        default:
          return 'py-8 lg:py-12';
      }
    };

    const getResponsivePaddingClass = (responsive: boolean) => {
      return responsive ? 'px-4 lg:px-0' : '';
    };

    const containerClasses = combineStyles(
      layoutStyles.container, // 'container mx-auto py-8' from shared-styles
      getPaddingClass(padding),
      getResponsivePaddingClass(responsivePadding),
      containerClassName
    );

    return (
      <main
        ref={ref}
        role="main"
        className={combineStyles(layoutStyles.fullHeight, 'bg-background', className)}
        {...props}
      >
        <div className={containerClasses}>
          {title && <h1 className={pageStyles.title.page}>{title}</h1>}
          {children}
        </div>
      </main>
    );
  }
);

PageLayout.displayName = 'PageLayout';
