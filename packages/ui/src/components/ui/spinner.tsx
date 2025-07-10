import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils';

const spinnerVariants = cva(
  'animate-spin rounded-full border-solid border-current border-r-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 border-2',
        default: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-[3px]',
        xl: 'h-12 w-12 border-4',
      },
      variant: {
        default: 'text-primary',
        secondary: 'text-secondary-foreground',
        muted: 'text-muted-foreground',
        accent: 'text-accent-foreground',
        destructive: 'text-destructive',
        success: 'text-green-600 dark:text-green-400',
        warning: 'text-yellow-600 dark:text-yellow-400',
        info: 'text-blue-600 dark:text-blue-400',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  /**
   * Whether to show the spinner
   */
  show?: boolean;
  /**
   * Text label for screen readers
   */
  srText?: string;
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, variant, show = true, srText = 'Loading...', ...props }, ref) => {
    if (!show) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(spinnerVariants({ size, variant }), className)}
        role="status"
        aria-label={srText}
        {...props}
      >
        <span className="sr-only">{srText}</span>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

// Spinner with overlay for full-page loading
export interface SpinnerOverlayProps extends Omit<SpinnerProps, 'content'> {
  /**
   * Background overlay opacity
   */
  overlayOpacity?: 'light' | 'medium' | 'heavy';
  /**
   * Additional content to show below the spinner
   */
  content?: React.ReactNode;
}

const overlayVariants = cva(
  'fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm',
  {
    variants: {
      overlayOpacity: {
        light: 'bg-background/50',
        medium: 'bg-background/80',
        heavy: 'bg-background/95',
      },
    },
    defaultVariants: {
      overlayOpacity: 'medium',
    },
  }
);

const SpinnerOverlay = React.forwardRef<HTMLDivElement, SpinnerOverlayProps>(
  ({ overlayOpacity, content, className, ...spinnerProps }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(overlayVariants({ overlayOpacity }), className)}
        aria-live="polite"
        aria-busy="true"
      >
        <Spinner {...spinnerProps} />
        {content && <div className="mt-4 text-center text-sm text-muted-foreground">{content}</div>}
      </div>
    );
  }
);

SpinnerOverlay.displayName = 'SpinnerOverlay';

// Inline spinner for buttons and smaller components
export interface InlineSpinnerProps extends Omit<SpinnerProps, 'size'> {
  /**
   * Size based on text scale
   */
  size?: 'xs' | 'sm' | 'base';
}

const inlineSpinnerVariants = cva(
  'inline-block animate-spin rounded-full border-solid border-current border-r-transparent',
  {
    variants: {
      size: {
        xs: 'h-3 w-3 border border-r-transparent',
        sm: 'h-4 w-4 border-2 border-r-transparent',
        base: 'h-5 w-5 border-2 border-r-transparent',
      },
    },
    defaultVariants: {
      size: 'base',
    },
  }
);

// Get variant class for inline spinner
function getInlineVariantClass(variant: SpinnerProps['variant']) {
  switch (variant) {
    case 'secondary':
      return 'text-secondary-foreground';
    case 'muted':
      return 'text-muted-foreground';
    case 'accent':
      return 'text-accent-foreground';
    case 'destructive':
      return 'text-destructive';
    case 'success':
      return 'text-green-600 dark:text-green-400';
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'info':
      return 'text-blue-600 dark:text-blue-400';
    default:
      return 'text-current';
  }
}

const InlineSpinner = React.forwardRef<HTMLSpanElement, InlineSpinnerProps>(
  ({ className, size, variant, show = true, srText = 'Loading...', ...props }, ref) => {
    if (!show) {
      return null;
    }

    const variantClass = getInlineVariantClass(variant);

    return (
      <span
        ref={ref}
        className={cn(inlineSpinnerVariants({ size }), variantClass, className)}
        role="status"
        aria-label={srText}
        {...props}
      >
        <span className="sr-only">{srText}</span>
      </span>
    );
  }
);

InlineSpinner.displayName = 'InlineSpinner';

export {
  Spinner,
  SpinnerOverlay,
  InlineSpinner,
  spinnerVariants,
  overlayVariants,
  inlineSpinnerVariants,
};
