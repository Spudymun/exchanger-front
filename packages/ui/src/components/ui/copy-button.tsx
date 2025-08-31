'use client';

import { useCopyToClipboard } from '@repo/hooks';
import { cva, type VariantProps } from 'class-variance-authority';
import { Copy, CheckIcon, RefreshCw } from 'lucide-react';
import { forwardRef } from 'react';

import { cn } from '../../lib/utils';

// Следуем паттерну button.tsx с cva
const copyButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
      },
      size: {
        icon: 'size-11',
        sm: 'h-10 rounded-md gap-1.5 px-3 text-sm has-[>svg]:px-2.5',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'icon',
    },
  }
);

export interface CopyButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof copyButtonVariants> {
  /** Значение для копирования */
  value: string;
  /** Дополнительные CSS классы */
  className?: string;
}

/**
 * Кнопка копирования с визуальной обратной связью
 *
 * Интегрируется с существующей системой кнопок проекта:
 * - Использует cva паттерн как button.tsx
 * - Поддерживает ghost и outline варианты
 * - Имеет icon и sm размеры
 * - Следует системе accessibility
 *
 * @example
 * ```tsx
 * function CopyableAddress({ address }: { address: string }) {
 *   return (
 *     <div className="flex items-center gap-2">
 *       <span className="font-mono">{address}</span>
 *       <CopyButton
 *         value={address}
 *         variant="ghost"
 *         size="sm"
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
  ({ value, className, variant, size, title, ...props }, ref) => {
    const { isCopied, isLoading, copy } = useCopyToClipboard({
      successDuration: 2000,
    });

    const handleCopy = () => {
      copy(value);
    };

    const Icon = isLoading ? RefreshCw : isCopied ? CheckIcon : Copy;

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          copyButtonVariants({ variant, size }),
          isCopied && 'text-green-600 dark:text-green-400',
          className
        )}
        onClick={handleCopy}
        disabled={isLoading}
        title={title || (isCopied ? 'Copied!' : 'Copy to clipboard')}
        {...props}
      >
        <Icon className={cn('h-4 w-4', isLoading && 'animate-spin')} />
      </button>
    );
  }
);

CopyButton.displayName = 'CopyButton';
