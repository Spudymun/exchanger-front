// ExchangeGO Design System Components v2.1
// Готовые компоненты с улучшенной визуальной иерархией для темной темы
// Обновлено: 12 июля 2025

import {
  semanticTokens,
  formContainers,
  enhancedCards,
  layoutPatterns,
  interactionStates,
} from './form-patterns';

// === ГОТОВЫЕ КЛАССЫ С УЛУЧШЕННЫМ КОНТРАСТОМ ===

export const DesignSystemClasses = {
  // Exchange Form Containers с улучшенными тенями
  exchangeForm: {
    compact:
      'bg-card backdrop-blur-sm text-card-foreground border border-border/80 rounded-xl shadow-md shadow-black/10 dark:shadow-black/30 p-6 space-y-6',
    full: formContainers.exchangeForm.variants.full,
    mobile: formContainers.exchangeForm.variants.mobile,
    featured: formContainers.exchangeForm.variants.featured,
    subtle: formContainers.exchangeForm.variants.subtle,
  },

  // Card Layouts с увеличенными отступами
  cardPair: {
    horizontal: 'grid grid-cols-1 md:grid-cols-2 gap-8 items-start',
    vertical: 'space-y-6',
    compact: 'grid grid-cols-1 gap-6',
    connected: 'grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative',
  },

  // Exchange Cards с улучшенными цветовыми акцентами для обеих тем
  exchangeCard: {
    sending: `${enhancedCards.exchangeCard.base} border-l-4 border-l-blue-500 dark:border-l-blue-400 shadow-md shadow-blue-500/15 dark:shadow-blue-400/20`,
    receiving: `${enhancedCards.exchangeCard.base} border-l-4 border-l-green-500 dark:border-l-green-400 shadow-md shadow-green-500/15 dark:shadow-green-400/20`,
    neutral: enhancedCards.exchangeCard.base,
    featured: `${enhancedCards.exchangeCard.base} ${enhancedCards.exchangeCard.variants.featured}`,
  },

  // Action Areas с четкими разделителями для обеих тем
  actionArea: {
    simple: 'flex justify-center pt-6',
    separated:
      'flex justify-center pt-6 border-t border-border/70 dark:border-border/60 mt-6 shadow-sm',
    prominent:
      'bg-accent/30 dark:bg-accent/20 rounded-lg p-4 mt-6 border border-border/50 dark:border-border/40 flex justify-center',
    inline: 'flex justify-center pt-6',
  },

  // Interactive States
  button: {
    base: `${interactionStates.button.default} ${interactionStates.button.hover} ${interactionStates.button.active} ${interactionStates.button.focus}`,
    disabled: interactionStates.button.disabled,
  },

  card: {
    base: `${interactionStates.card.default} ${interactionStates.card.hover}`,
    selected: interactionStates.card.selected,
    error: interactionStates.card.error,
  },

  // Surfaces
  surfaces: {
    page: semanticTokens.surfaces.page,
    elevated: semanticTokens.surfaces.elevated,
    accent: semanticTokens.surfaces.accent,
    muted: semanticTokens.surfaces.muted,
    interactive: semanticTokens.surfaces.interactive,
  },

  // Layout Patterns
  complexComponent: {
    wrapper: layoutPatterns.complexComponent.wrapper,
    content: layoutPatterns.complexComponent.content,
    horizontalGroup: layoutPatterns.complexComponent.horizontalGroup,
    actions: layoutPatterns.complexComponent.actions,
  },
};

// === УТИЛИТАРНЫЕ ФУНКЦИИ ===

export const cn = (...classes: Array<string | undefined | null | false>): string => {
  return classes.filter(Boolean).join(' ');
};

// Создание классов с состояниями
export const createStateClasses = (baseClass: string) => ({
  default: baseClass,
  hover: cn(baseClass, 'hover:opacity-80'),
  active: cn(baseClass, 'active:scale-95'),
  focus: cn(baseClass, 'focus:ring-2 focus:ring-ring'),
  disabled: cn(baseClass, 'disabled:opacity-50'),
  error: cn(baseClass, 'border-destructive'),
  success: cn(baseClass, 'border-green-500'),
});

// === ГОТОВЫЕ КОМПОНЕНТЫ ===

export const FormContainer = {
  // Exchange форма - компактная версия для hero
  ExchangeHero: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn(DesignSystemClasses.exchangeForm.compact, className)}>{children}</div>
  ),

  // Exchange форма - полная версия
  ExchangeFull: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn(DesignSystemClasses.exchangeForm.full, className)}>{children}</div>
  ),

  // Контейнер для пары карточек
  CardPair: ({
    children,
    layout = 'horizontal',
    className,
  }: {
    children: React.ReactNode;
    layout?: 'horizontal' | 'vertical' | 'compact';
    className?: string;
  }) => {
    const layoutClass =
      layout === 'horizontal'
        ? DesignSystemClasses.cardPair.horizontal
        : layout === 'vertical'
          ? DesignSystemClasses.cardPair.vertical
          : DesignSystemClasses.cardPair.compact;
    return <div className={cn(layoutClass, className)}>{children}</div>;
  },

  // Action область
  ActionArea: ({
    children,
    variant = 'simple',
    className,
  }: {
    children: React.ReactNode;
    variant?: 'simple' | 'separated' | 'inline';
    className?: string;
  }) => {
    const variantClass =
      variant === 'simple'
        ? DesignSystemClasses.actionArea.simple
        : variant === 'separated'
          ? DesignSystemClasses.actionArea.separated
          : DesignSystemClasses.actionArea.inline;
    return <div className={cn(variantClass, className)}>{children}</div>;
  },
};

export default {
  DesignSystemClasses,
  FormContainer,
  cn,
  createStateClasses,
};
