'use client';

import { THEME_MODES } from '@repo/constants';
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

interface ThemeToggleProps {
  labels?: {
    light: string;
    dark: string;
    system: string;
    toggle: string;
  };
}

export function ThemeToggle({ labels }: ThemeToggleProps = {}) {
  const { theme, setTheme } = useTheme();

  // Default labels (can be overridden by parent for i18n)
  const defaultLabels = {
    light: 'Светлая',
    dark: 'Темная',
    system: 'Система',
    toggle: 'Переключить тему',
  };

  const themeLabels = { ...defaultLabels, ...labels };

  const handleLightTheme = React.useCallback(() => {
    setTheme(THEME_MODES.LIGHT);
  }, [setTheme]);

  const handleDarkTheme = React.useCallback(() => {
    setTheme(THEME_MODES.DARK);
  }, [setTheme]);

  const handleSystemTheme = React.useCallback(() => {
    setTheme(THEME_MODES.SYSTEM);
  }, [setTheme]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-7 w-7" aria-label={themeLabels.toggle}>
          <Sun className="h-[0.9rem] w-[0.9rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[0.9rem] w-[0.9rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{themeLabels.toggle}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleLightTheme} className="cursor-pointer">
          <Sun className="mr-2 h-4 w-4" />
          <span>{themeLabels.light}</span>
          {theme === THEME_MODES.LIGHT && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDarkTheme} className="cursor-pointer">
          <Moon className="mr-2 h-4 w-4" />
          <span>{themeLabels.dark}</span>
          {theme === THEME_MODES.DARK && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSystemTheme} className="cursor-pointer">
          <Monitor className="mr-2 h-4 w-4" />
          <span>{themeLabels.system}</span>
          {theme === THEME_MODES.SYSTEM && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
