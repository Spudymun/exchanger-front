import * as React from 'react';

import { combineStyles, layoutStyles } from '../lib/shared-styles';

export interface CenteredPageLayoutProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Основной заголовок (например, "404")
   */
  heading?: string;
  /**
   * Подзаголовок
   */
  subheading?: string;
  /**
   * Описание ошибки
   */
  description?: string;
  /**
   * Максимальная ширина контента
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

/**
 * CenteredPageLayout Component
 *
 * Layout для центрированных страниц:
 * - Error страницы (404, 500)
 * - Loading страницы
 * - Auth страницы с центрированным контентом
 * - Простые информационные страницы
 *
 * Особенности:
 * - Полная высота экрана с центрированием
 * - Ограниченная ширина контента
 * - Стандартные заголовки для error страниц
 *
 * @example
 * ```tsx
 * <CenteredPageLayout
 *   heading="404"
 *   subheading="Page Not Found"
 *   description="The page you're looking for doesn't exist."
 *   maxWidth="md"
 * >
 *   <Button>Go Home</Button>
 * </CenteredPageLayout>
 * ```
 */
export const CenteredPageLayout = React.forwardRef<HTMLElement, CenteredPageLayoutProps>(
  ({ className, heading, subheading, description, maxWidth = 'md', children, ...props }, ref) => {
    const getMaxWidthClass = (width: typeof maxWidth) => {
      switch (width) {
        case 'sm':
          return 'max-w-sm';
        case 'md':
          return 'max-w-md';
        case 'lg':
          return 'max-w-lg';
        case 'xl':
          return 'max-w-xl';
        default:
          return 'max-w-md';
      }
    };

    return (
      <main
        ref={ref}
        role="main"
        className={combineStyles(
          layoutStyles.fullHeight,
          'bg-background flex flex-col items-center justify-center px-4',
          className
        )}
        {...props}
      >
        <div className={`text-center space-y-6 ${getMaxWidthClass(maxWidth)}`}>
          {heading && (
            <div className="space-y-2">
              <h1 className="text-6xl font-bold tracking-tight">{heading}</h1>
              {subheading && <h2 className="text-2xl font-semibold">{subheading}</h2>}
              {description && <p className="text-lg text-muted-foreground">{description}</p>}
            </div>
          )}

          <div className="space-y-3">{children}</div>
        </div>
      </main>
    );
  }
);

CenteredPageLayout.displayName = 'CenteredPageLayout';
