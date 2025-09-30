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
            'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary bg-background ring-offset-background cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-checked:bg-primary peer-checked:text-primary-foreground',
            className
          )}
        >
          <CheckIcon className="h-4 w-4 opacity-0 peer-checked:opacity-100" />
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
