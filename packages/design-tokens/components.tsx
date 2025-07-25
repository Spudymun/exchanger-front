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
    withArrow: 'grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-8 items-start',
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

  // Arrow Components для Exchange Form - Professional Implementation
  exchangeArrow: {
    // Контейнер для адаптивной стрелки
    container: 'flex justify-center items-center lg:py-8 relative group',

    // Мобильная стрелка (направление вниз)
    mobile:
      'block lg:hidden h-6 w-6 text-muted-foreground/70 group-hover:text-muted-foreground transition-colors duration-200',

    // Десктопная стрелка (направление вправо)
    desktop:
      'hidden lg:block h-6 w-6 text-muted-foreground/70 group-hover:text-muted-foreground transition-colors duration-200',

    // Декоративный фон с улучшенным стилем
    background:
      'absolute inset-0 -m-4 bg-background/90 rounded-full border border-border/30 backdrop-blur-sm -z-10 group-hover:border-border/50 group-hover:bg-background transition-all duration-200 shadow-sm',

    // Дополнительный эффект свечения
    glow: 'absolute inset-0 -m-4 rounded-full bg-gradient-to-r from-blue-500/5 to-green-500/5 -z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
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

// === READY-TO-USE COMPONENTS ===

// Вспомогательный компонент для SVG стрелки вниз (мобильная)
const ExchangeArrowMobile = ({ sizeClass }: { sizeClass: string }) => (
  <svg
    className={cn(DesignSystemClasses.exchangeArrow.mobile, sizeClass)}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 14l-7 7m0 0l-7-7m7 7V3"
    />
  </svg>
);

// Вспомогательный компонент для SVG стрелки вправо (десктоп)
const ExchangeArrowDesktop = ({ sizeClass }: { sizeClass: string }) => (
  <svg
    className={cn(DesignSystemClasses.exchangeArrow.desktop, sizeClass)}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 8l4 4m0 0l-4 4m4-4H3"
    />
  </svg>
);

function getSizeClass(size: 'small' | 'default' | 'large'): string {
  switch (size) {
    case 'small':
      return 'h-4 w-4';
    case 'large':
      return 'h-8 w-8';
    default:
      return 'h-6 w-6';
  }
}

export const ExchangeArrow = ({
  className,
  size = 'default',
  showGlow = true,
}: {
  className?: string;
  size?: 'small' | 'default' | 'large';
  showGlow?: boolean;
}) => {
  const sizeClass = getSizeClass(size);

  return (
    <div className={cn(DesignSystemClasses.exchangeArrow.container, className)}>
      <div className={DesignSystemClasses.exchangeArrow.background} />
      {showGlow && <div className={DesignSystemClasses.exchangeArrow.glow} />}
      <ExchangeArrowMobile sizeClass={sizeClass} />
      <ExchangeArrowDesktop sizeClass={sizeClass} />
    </div>
  );
};

export default {
  DesignSystemClasses,
  FormContainer,
  ExchangeArrow,
  cn,
  createStateClasses,
};
