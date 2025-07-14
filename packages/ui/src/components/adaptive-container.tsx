'use client';

import { createContext, useContext, forwardRef, type HTMLAttributes } from 'react';

import { cn } from '../lib/utils';

// ========================================================================================
// AdaptiveContainer - Система математического контроля ширины 2025
// Создано для устранения ограничений fixed breakpoints в HeroSection
// Использует CSS custom properties + container queries для precise width control
// ========================================================================================

// ------------------------------
// CSS Custom Properties API
// ------------------------------
export interface AdaptiveWidthProps {
  /**
   * Базовая ширина (min) - точка отсчета
   * @default 320px
   */
  minWidth?: number;

  /**
   * Максимальная ширина (max) - верхний предел
   * @default 1200px
   */
  maxWidth?: number;

  /**
   * Предпочтительная ширина (preferred) - оптимальное значение
   * @default 800px
   */
  preferredWidth?: number;

  /**
   * Коэффициент роста (growth-factor) - скорость адаптации
   * @default 0.85
   * @range 0.1-1.0
   */
  growthFactor?: number;

  /**
   * Режим адаптации
   * - 'clamp': clamp(min, preferred, max) - математический контроль
   * - 'fluid': комбинация vw + rem для плавности
   * - 'container': на базе container queries
   * @default 'clamp'
   */
  adaptationMode?: 'clamp' | 'fluid' | 'container';

  /**
   * Container query breakpoints для container mode
   */
  containerBreakpoints?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}

// ------------------------------
// Context для передачи настроек
// ------------------------------
const AdaptiveContainerContext = createContext<AdaptiveWidthProps | null>(null);

export const useAdaptiveContainer = () => {
  return useContext(AdaptiveContainerContext);
};

// ------------------------------
// Константы
// ------------------------------
const REFERENCE_VIEWPORT_WIDTH = 1920; // Эталонная ширина viewport для fluid scaling

// ------------------------------
// Утилита для создания CSS properties
// ------------------------------
export const createAdaptiveStyles = (props: AdaptiveWidthProps) => {
  const {
    minWidth = 320,
    maxWidth = 1200,
    preferredWidth = 800,
    growthFactor = 0.85,
    adaptationMode = 'clamp',
    containerBreakpoints = {
      sm: '(min-width: 20rem)',
      md: '(min-width: 48rem)',
      lg: '(min-width: 64rem)',
      xl: '(min-width: 80rem)',
    },
  } = props;

  // CSS custom properties object
  const cssVariables: Record<string, string> = {
    '--adaptive-min-width': `${minWidth}px`,
    '--adaptive-max-width': `${maxWidth}px`,
    '--adaptive-preferred-width': `${preferredWidth}px`,
    '--adaptive-growth-factor': growthFactor.toString(),
  };

  // Width calculation по режиму
  let widthValue: string;

  switch (adaptationMode) {
    case 'clamp': {
      // Математический clamp() - precise control
      widthValue = `clamp(${minWidth}px, ${preferredWidth}px, ${maxWidth}px)`;
      break;
    }

    case 'fluid': {
      // Fluid scaling: комбинация viewport + rem
      const vwPercent = (preferredWidth / REFERENCE_VIEWPORT_WIDTH) * 100;
      widthValue = `clamp(${minWidth}px, ${vwPercent}vw, ${maxWidth}px)`;
      break;
    }

    case 'container': {
      // Container queries based width
      widthValue = preferredWidth + 'px';
      // Container queries будут применены через CSS
      break;
    }

    default: {
      widthValue = `${preferredWidth}px`;
      break;
    }
  }

  cssVariables['--adaptive-width'] = widthValue;

  return {
    style: cssVariables as React.CSSProperties,
    containerBreakpoints,
    adaptationMode,
  };
};

// ------------------------------
// Создание className на основе AdaptiveWidthProps
// ------------------------------
const createAdaptiveClassName = (props: AdaptiveWidthProps): string => {
  const { adaptationMode = 'clamp' } = props;
  const shouldUseContainerQueries = adaptationMode === 'container';

  return cn(
    // Базовые стили для adaptive container
    'adaptive-container mx-auto px-4',

    // Container queries support
    shouldUseContainerQueries && 'container-type-inline-size',

    // Адаптивные стили на базе режима
    adaptationMode === 'clamp' && 'w-[var(--adaptive-width)]',
    adaptationMode === 'fluid' && 'w-[var(--adaptive-width)]',
    adaptationMode === 'container' && [
      'w-[var(--adaptive-preferred-width)]',
      // Container query responsive classes будут добавлены через CSS
    ]
  );
};

// ------------------------------
// Основной AdaptiveContainer компонент
// ------------------------------
export interface AdaptiveContainerProps extends HTMLAttributes<HTMLDivElement>, AdaptiveWidthProps {
  /**
   * Применить ли container queries context
   * @default true для container mode
   */
  enableContainerQueries?: boolean;

  /**
   * Дополнительные CSS классы
   */
  className?: string;

  /**
   * Дети компонента
   */
  children?: React.ReactNode;
}

export const AdaptiveContainer = forwardRef<HTMLDivElement, AdaptiveContainerProps>(
  (
    {
      children,
      className,
      enableContainerQueries: _enableContainerQueries,
      minWidth = 320,
      maxWidth = 1200,
      preferredWidth = 800,
      growthFactor = 0.85,
      adaptationMode = 'clamp',
      containerBreakpoints,
      ...props
    },
    ref
  ) => {
    const adaptiveProps: AdaptiveWidthProps = {
      minWidth,
      maxWidth,
      preferredWidth,
      growthFactor,
      adaptationMode,
      containerBreakpoints,
    };

    const { style } = createAdaptiveStyles(adaptiveProps);
    const adaptiveClassName = createAdaptiveClassName(adaptiveProps);

    return (
      <AdaptiveContainerContext.Provider value={adaptiveProps}>
        <div
          ref={ref}
          className={cn(adaptiveClassName, className)}
          style={{
            ...style,
            ...props.style,
          }}
          {...props}
        >
          {children}
        </div>
      </AdaptiveContainerContext.Provider>
    );
  }
);

AdaptiveContainer.displayName = 'AdaptiveContainer';

// ------------------------------
// CSS Module для container queries
// ------------------------------
export const adaptiveContainerCSS = `
/* AdaptiveContainer CSS - Container Queries Support */
.adaptive-container {
  container-type: inline-size;
  width: var(--adaptive-width);
}

/* Container query responsive styles */
@container (min-width: 20rem) {
  .adaptive-container {
    --adaptive-scale: 1.1;
  }
}

@container (min-width: 48rem) {
  .adaptive-container {
    --adaptive-scale: 1.25;
  }
}

@container (min-width: 64rem) {
  .adaptive-container {
    --adaptive-scale: 1.4;
  }
}

@container (min-width: 80rem) {
  .adaptive-container {
    --adaptive-scale: 1.5;
  }
}

/* Utility classes для математического контроля */
.adaptive-width-precise {
  width: clamp(var(--adaptive-min-width), var(--adaptive-preferred-width), var(--adaptive-max-width));
}

.adaptive-width-fluid {
  width: clamp(var(--adaptive-min-width), calc(var(--adaptive-preferred-width) * var(--adaptive-growth-factor)), var(--adaptive-max-width));
}

.adaptive-width-responsive {
  width: var(--adaptive-width);
  container-type: inline-size;
}
`;

// ------------------------------
// Preset конфигурации для типичных случаев
// ------------------------------
export const adaptivePresets = {
  hero: {
    minWidth: 320,
    maxWidth: 1200,
    preferredWidth: 900,
    growthFactor: 0.9,
    adaptationMode: 'clamp' as const,
  },

  form: {
    minWidth: 280,
    maxWidth: 800,
    preferredWidth: 600,
    growthFactor: 0.85,
    adaptationMode: 'fluid' as const,
  },

  content: {
    minWidth: 320,
    maxWidth: 1000,
    preferredWidth: 750,
    growthFactor: 0.8,
    adaptationMode: 'container' as const,
  },

  narrow: {
    minWidth: 280,
    maxWidth: 600,
    preferredWidth: 480,
    growthFactor: 0.9,
    adaptationMode: 'clamp' as const,
  },

  wide: {
    minWidth: 400,
    maxWidth: 1600,
    preferredWidth: 1200,
    growthFactor: 0.85,
    adaptationMode: 'fluid' as const,
  },
} as const;

// ------------------------------
// Helper для применения preset (безопасное обращение)
// ------------------------------
export const useAdaptivePreset = (presetName: keyof typeof adaptivePresets): AdaptiveWidthProps => {
  // Явное сопоставление для избежания Generic Object Injection
  switch (presetName) {
    case 'hero':
      return { ...adaptivePresets.hero };
    case 'form':
      return { ...adaptivePresets.form };
    case 'content':
      return { ...adaptivePresets.content };
    case 'narrow':
      return { ...adaptivePresets.narrow };
    case 'wide':
      return { ...adaptivePresets.wide };
    default:
      throw new Error(`Invalid preset name: ${String(presetName)}`);
  }
};

// ------------------------------
// Экспорт всех компонентов
// ------------------------------
export default AdaptiveContainer;
