'use client';

import { CheckIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/utils';

export interface CheckboxProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  className?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Объединяем refs безопасно
    React.useImperativeHandle(ref, () => inputRef.current || ({} as HTMLInputElement));

    const handleDivClick = () => {
      if (inputRef.current) {
        inputRef.current.click();
      }
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={inputRef}
          className={cn(
            'peer h-4 w-4 shrink-0 rounded-sm border border-primary bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sr-only',
            className
          )}
          {...props}
        />
        <div
          onClick={handleDivClick}
          className={cn(
            // Base styles - unchecked state
            'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary bg-background ring-offset-background cursor-pointer',
            // Focus styles
            'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
            // Disabled styles
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            // Gradient checked state - using CSS variables for theme compatibility
            'peer-checked:bg-gradient-to-br peer-checked:from-primary peer-checked:to-primary/80',
            'peer-checked:border-primary peer-checked:shadow-lg peer-checked:shadow-primary/25',
            // Dark theme enhancement
            'dark:peer-checked:shadow-primary/40',
            // Hover and interaction enhancements
            'transition-all duration-200 ease-out',
            'peer-checked:scale-105 hover:scale-110 hover:shadow-md',
            className
          )}
        >
          <CheckIcon
            className={cn(
              'h-3 w-3 text-primary-foreground opacity-0 scale-75',
              'peer-checked:opacity-100 peer-checked:scale-100',
              'transition-all duration-200 ease-out delay-75'
            )}
          />
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
