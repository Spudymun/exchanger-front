import * as React from 'react';

import { cn } from '../lib/utils';

export interface SectionLayoutProps {
  /**
   * HTML-тег для секции
   */
  as?: 'section' | 'div';
  /**
   * Максимальная ширина контейнера
   */
  maxWidth?: 'full' | 'screen-xl' | 'screen-2xl' | '7xl' | '6xl' | '5xl' | '4xl';
  /**
   * Вертикальные отступы
   */
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /**
   * Горизонтальные отступы
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * Фон секции
   */
  background?: 'default' | 'muted' | 'accent' | 'card';
  /**
   * CSS классы
   */
  className?: string;
  /**
   * Дополнительные CSS классы для контейнера
   */
  containerClassName?: string;
  /**
   * Дочерние элементы
   */
  children: React.ReactNode;
}

/**
 * SectionLayout Component
 *
 * Универсальный layout для крупных секций на страницах:
 * - Управляет spacing между секциями
 * - Задает максимальную ширину контента
 * - Поддерживает различные фоны
 * - Responsive padding
 *
 * Используется для:
 * - HeroSection, FeaturesSection, HowItWorksSection
 * - Крупные блоки контента
 * - Секции с различными фонами
 *
 * @example
 * ```tsx
 * <SectionLayout spacing="xl" background="muted" maxWidth="7xl">
 *   <h2>Features</h2>
 *   <FeatureGrid />
 * </SectionLayout>
 * ```
 */
export function SectionLayout({
  as = 'section',
  maxWidth = '7xl',
  spacing = 'lg',
  padding = 'md',
  background = 'default',
  containerClassName,
  className,
  children,
}: SectionLayoutProps) {
  const Component = as;

  const getSpacingClass = (spacing: string) => {
    switch (spacing) {
      case 'none':
        return '';
      case 'sm':
        return 'py-8';
      case 'md':
        return 'py-12';
      case 'lg':
        return 'py-16 sm:py-20';
      case 'xl':
        return 'py-20 sm:py-24';
      case '2xl':
        return 'py-24 sm:py-32';
      default:
        return 'py-16 sm:py-20';
    }
  };

  const getPaddingClass = (padding: string) => {
    switch (padding) {
      case 'none':
        return '';
      case 'sm':
        return 'px-4';
      case 'md':
        return 'px-4 sm:px-6';
      case 'lg':
        return 'px-4 sm:px-6 lg:px-8';
      default:
        return 'px-4 sm:px-6';
    }
  };

  const getBackgroundClass = (background: string) => {
    switch (background) {
      case 'default':
        return '';
      case 'muted':
        return 'bg-muted/30';
      case 'accent':
        return 'bg-accent/10';
      case 'card':
        return 'bg-card';
      default:
        return '';
    }
  };

  const getMaxWidthClass = (maxWidth: string) => {
    switch (maxWidth) {
      case 'full':
        return 'max-w-full';
      case 'screen-xl':
        return 'max-w-screen-xl';
      case 'screen-2xl':
        return 'max-w-screen-2xl';
      case '7xl':
        return 'max-w-7xl';
      case '6xl':
        return 'max-w-6xl';
      case '5xl':
        return 'max-w-5xl';
      case '4xl':
        return 'max-w-4xl';
      default:
        return 'max-w-7xl';
    }
  };

  return (
    <Component
      className={cn(
        'relative',
        getSpacingClass(spacing),
        getBackgroundClass(background),
        className
      )}
    >
      <div
        className={cn(
          getMaxWidthClass(maxWidth),
          'mx-auto',
          getPaddingClass(padding),
          containerClassName
        )}
      >
        {children}
      </div>
    </Component>
  );
}

SectionLayout.displayName = 'SectionLayout';
