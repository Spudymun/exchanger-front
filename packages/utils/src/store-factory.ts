import type { StateCreator } from 'zustand';
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

/**
 * Centralized Zustand Store Factory
 *
 * Eliminates duplication of store creation patterns across all stores.
 * Provides consistent middleware configuration and devtools setup.
 *
 * @example
 * ```typescript
 * interface MyStore {
 *   count: number;
 *   increment: () => void;
 * }
 *
 * export const useMyStore = createStore<MyStore>(
 *   'my-store',
 *   (set) => ({
 *     count: 0,
 *     increment: () => set(state => ({ count: state.count + 1 }))
 *   })
 * );
 * ```
 */

export interface StoreConfig {
  name: string;
  version?: number;
  enableSubscriptions?: boolean;
  enableDevtools?: boolean;
}

/**
 * Creates a Zustand store with standardized middleware configuration
 */
export function createStore<T>(
  config: StoreConfig | string,
  stateCreator: StateCreator<T, [], [], T>
) {
  const normalizedConfig: StoreConfig = typeof config === 'string' ? { name: config } : config;

  const {
    name,
    version = 1,
    enableSubscriptions = true,
    enableDevtools = process.env.NODE_ENV === 'development',
  } = normalizedConfig;

  return createStoreWithMiddleware(stateCreator, {
    name,
    version,
    enableSubscriptions,
    enableDevtools,
  });
}

// Helper function to reduce complexity
function createStoreWithMiddleware<T>(
  stateCreator: StateCreator<T, [], [], T>,
  options: {
    name: string;
    version: number;
    enableSubscriptions: boolean;
    enableDevtools: boolean;
  }
) {
  const { name, version, enableSubscriptions, enableDevtools } = options;

  if (enableSubscriptions && enableDevtools) {
    return create<T>()(devtools(subscribeWithSelector(stateCreator), { name, version }));
  }

  if (enableSubscriptions) {
    return create<T>()(subscribeWithSelector(stateCreator));
  }

  if (enableDevtools) {
    return create<T>()(devtools(stateCreator, { name, version }));
  }

  return create<T>()(stateCreator);
}

/**
 * Timer cleanup utilities for stores
 * Centralizes timer management patterns found across stores
 */
export interface TimerState {
  timers: Map<string, NodeJS.Timeout>;
}

export interface TimerActions {
  setTimer: (key: string, timerId: NodeJS.Timeout) => void;
  clearTimer: (key: string) => void;
  clearAllTimers: () => void;
}

/**
 * Creates timer management actions for stores
 * Eliminates duplication of timer cleanup patterns
 */
export function createTimerActions<T extends TimerState>(
  set: (fn: (state: T) => Partial<T>) => void,
  get: () => T
): TimerActions {
  return {
    setTimer: (key: string, timerId: NodeJS.Timeout) => {
      // Clear existing timer for this key
      const existingTimer = get().timers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      set(state => {
        const newTimers = new Map(state.timers);
        newTimers.set(key, timerId);
        return { timers: newTimers } as Partial<T>;
      });
    },

    clearTimer: (key: string) => {
      const timerId = get().timers.get(key);
      if (timerId) {
        clearTimeout(timerId);
      }

      set(state => {
        const newTimers = new Map(state.timers);
        newTimers.delete(key);
        return { timers: newTimers } as Partial<T>;
      });
    },

    clearAllTimers: () => {
      const timers = get().timers;
      for (const timerId of timers.values()) {
        clearTimeout(timerId);
      }

      set(
        () =>
          ({
            timers: new Map(),
          }) as Partial<T>
      );
    },
  };
}

/**
 * Debounce utility for store actions
 * Centralizes debounce pattern found in exchange-store
 */
export function createDebounceAction<T extends TimerState>(options: {
  set: (fn: (state: T) => Partial<T>) => void;
  get: () => T;
  action: () => void;
  delay: number;
  key?: string;
}) {
  const { set, get, action, delay, key = 'default' } = options;

  return () => {
    const timerActions = createTimerActions(set, get);

    // Clear existing debounce timer
    timerActions.clearTimer(key);

    // Set new debounce timer
    const timerId = setTimeout(() => {
      action();
      timerActions.clearTimer(key);
    }, delay);

    timerActions.setTimer(key, timerId);
  };
}
