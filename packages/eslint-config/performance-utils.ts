/**
 * React Performance Utilities
 * Расширение существующей performance infrastructure (lazy-loading.js)
 */

import React from 'react';

import { memoize } from './lazy-loading.js';

// === REACT CONTEXT OPTIMIZATION ===
/**
 * Оптимизированное создание context value с использованием существующей memoize
 * @param contextValue - значение для context
 * @param dependencies - массив зависимостей или auto-detect из Object.values
 */
export const createOptimizedContext = <T>(
  contextValue: T,
  dependencies?: readonly unknown[]
): T => {
  return React.useMemo(
    () => contextValue,
    dependencies || Object.values(contextValue as Record<string, unknown>)
  );
};

// === CALLBACK OPTIMIZATION ===
/**
 * Оптимизация объекта с callback функциями
 * @param callbacks - объект с функциями
 */
export const optimizeCallbacks = <T extends Record<string, (...args: unknown[]) => unknown>>(
  callbacks: T
): T => {
  return React.useMemo(() => callbacks, Object.values(callbacks));
};

// === COMPOUND COMPONENT CONTEXT OPTIMIZER ===
/**
 * Создание мемоизированного context для compound компонентов
 * Следует паттерну header-compound.tsx
 * @param value - context value
 * @param deps - explicit dependencies array
 */
export const createCompoundContext = <T>(value: T, deps: readonly unknown[]): T => {
  return React.useMemo(() => value, deps);
};

// === PERFORMANCE ENHANCEMENT HELPER ===
/**
 * Универсальный helper для мемоизации на основе существующей architecture
 * @param enhancementFn - функция для мемоизации
 * @param context - context для зависимостей
 */
export const enhanceWithMemoization = memoize(
  <T, C>(enhancementFn: (context: C) => T, context: C): T => {
    return React.useMemo(() => enhancementFn(context), [context]);
  }
);
