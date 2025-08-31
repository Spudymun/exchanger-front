import * as React from 'react';

import { PageLayout, PageLayoutProps } from './page-layout';

export interface StandardPageLayoutProps extends PageLayoutProps {
  /**
   * Максимальная ширина контейнера
   */
  maxWidth?: 'full' | 'screen-xl' | 'screen-2xl' | '7xl';
  /**
   * Вертикальное выравнивание контента
   */
  centerContent?: boolean;
  /**
   * Отображать floating action button
   */
  showFloatingButton?: boolean;
}

/**
 * StandardPageLayout Component
 *
 * Стандартный layout для обычных страниц сайта:
 * - Основан на базовом PageLayout
 * - Добавляет управление максимальной шириной
 * - Поддерживает центрирование контента
 * - Интеграция с floating buttons
 *
 * Используется для:
 * - Главная страница (home)
 * - Информационные страницы
 * - Лендинги и маркетинговые страницы
 *
 * @example
 * ```tsx
 * <StandardPageLayout maxWidth="7xl" showFloatingButton>
 *   <HeroSection />
 *   <FeaturesSection />
 * </StandardPageLayout>
 * ```
 */
export const StandardPageLayout = React.forwardRef<HTMLElement, StandardPageLayoutProps>(
  (
    {
      maxWidth = '7xl',
      centerContent = false,
      showFloatingButton = false,
      containerClassName,
      children,
      ...props
    },
    ref
  ) => {
    const getMaxWidthClass = (width: typeof maxWidth) => {
      switch (width) {
        case 'full':
          return 'max-w-full';
        case 'screen-xl':
          return 'max-w-screen-xl';
        case 'screen-2xl':
          return 'max-w-screen-2xl';
        case '7xl':
        default:
          return 'max-w-7xl';
      }
    };

    const getCenteringClass = (center: boolean) => {
      return center ? 'flex flex-col items-center justify-center min-h-[80vh]' : '';
    };

    const combinedContainerClassName = [
      getMaxWidthClass(maxWidth),
      'mx-auto px-2 sm:px-4 space-y-8 sm:space-y-12 lg:space-y-16',
      getCenteringClass(centerContent),
      containerClassName,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <>
        <PageLayout
          ref={ref}
          containerClassName={combinedContainerClassName}
          padding="large" // По умолчанию большие отступы для стандартных страниц
          responsivePadding={false} // Управляем padding сами через containerClassName
          {...props}
        >
          {children}
        </PageLayout>
        {showFloatingButton && (
          <div className="fixed bottom-6 right-6 z-50">
            {/* Placeholder для floating button - можно будет заменить на конкретную реализацию */}
            <div className="w-14 h-14 bg-primary rounded-full shadow-lg"></div>
          </div>
        )}
      </>
    );
  }
);

StandardPageLayout.displayName = 'StandardPageLayout';
