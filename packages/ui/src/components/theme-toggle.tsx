'use client';

import { useTheme } from '@repo/providers';
import { Monitor, Moon, Sun } from 'lucide-react';
import * as React from 'react';

import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleLightTheme = React.useCallback(() => {
    setTheme('light');
  }, [setTheme]);

  const handleDarkTheme = React.useCallback(() => {
    setTheme('dark');
  }, [setTheme]);

  const handleSystemTheme = React.useCallback(() => {
    setTheme('system');
  }, [setTheme]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Переключить тему">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Переключить тему</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleLightTheme} className="cursor-pointer">
          <Sun className="mr-2 h-4 w-4" />
          <span>Светлая</span>
          {theme === 'light' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDarkTheme} className="cursor-pointer">
          <Moon className="mr-2 h-4 w-4" />
          <span>Темная</span>
          {theme === 'dark' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSystemTheme} className="cursor-pointer">
          <Monitor className="mr-2 h-4 w-4" />
          <span>Система</span>
          {theme === 'system' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
