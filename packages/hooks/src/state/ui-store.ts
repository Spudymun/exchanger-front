import { UI_NUMERIC_CONSTANTS } from '@repo/constants';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Global UI State Store
 *
 * Manages app-wide UI state including:
 * - Sidebar visibility
 * - Modal states
 * - Notifications
 * - Loading states
 * - Layout preferences
 *
 * @example
 * ```tsx
 * import { useUIStore } from '@repo/hooks'
 *
 * function MyComponent() {
 *   const { sidebarOpen, toggleSidebar } = useUIStore()
 *   return <button onClick={toggleSidebar}>Toggle</button>
 * }
 * ```
 */

// UI State Store
interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Modals
  activeModal: string | null;
  modals: {
    settings: boolean;
    trade: boolean;
    deposit: boolean;
    withdraw: boolean;
  };
  openModal: (modalId: string) => void;
  closeModal: () => void;
  openSpecificModal: (modal: keyof UIState['modals']) => void;
  closeSpecificModal: (modal: keyof UIState['modals']) => void;

  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: number;
  }>;
  notificationTimers: Map<string, NodeJS.Timeout>; // Добавляем для cleanup
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Loading states
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;

  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Layout
  layout: 'default' | 'compact' | 'wide';
  setLayout: (layout: UIState['layout']) => void;
}

// Helper functions for UI Store actions
const createSidebarActions = (
  set: (partial: Partial<UIState> | ((state: UIState) => Partial<UIState>)) => void
) => ({
  toggleSidebar: () => set((state: UIState) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
});

const createModalActions = (
  set: (partial: Partial<UIState> | ((state: UIState) => Partial<UIState>)) => void
) => ({
  openModal: (modalId: string) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
  openSpecificModal: (modal: keyof UIState['modals']) =>
    set((state: UIState) => ({
      modals: { ...state.modals, [modal]: true },
    })),
  closeSpecificModal: (modal: keyof UIState['modals']) =>
    set((state: UIState) => ({
      modals: { ...state.modals, [modal]: false },
    })),
});

const createNotificationActions = (
  set: (partial: Partial<UIState> | ((state: UIState) => Partial<UIState>)) => void,
  get: () => UIState
) => ({
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => {
    const id = Math.random()
      .toString(UI_NUMERIC_CONSTANTS.ID_GENERATION_BASE)
      .substr(2, UI_NUMERIC_CONSTANTS.ID_GENERATION_LENGTH);
    const timestamp = Date.now();
    set((state: UIState) => ({
      notifications: [...state.notifications, { ...notification, id, timestamp }],
    }));

    // Auto-remove after timeout with cleanup
    const timerId = setTimeout(() => {
      get().removeNotification(id);
    }, UI_NUMERIC_CONSTANTS.NOTIFICATION_AUTO_REMOVE_TIMEOUT);

    // Сохраняем timerId для возможности cleanup
    set((state: UIState) => {
      const newTimers = new Map(state.notificationTimers);
      newTimers.set(id, timerId);
      return { notificationTimers: newTimers };
    });
  },

  removeNotification: (id: string) => {
    // Очищаем таймер при ручном удалении
    const timers = get().notificationTimers;
    const timerId = timers.get(id);
    if (timerId) {
      clearTimeout(timerId);
    }

    set((state: UIState) => {
      const newTimers = new Map(state.notificationTimers);
      newTimers.delete(id);
      return {
        notifications: state.notifications.filter(n => n.id !== id),
        notificationTimers: newTimers,
      };
    });
  },

  clearNotifications: () => {
    // Очищаем все таймеры
    const timers = get().notificationTimers;
    for (const timerId of timers.values()) {
      clearTimeout(timerId);
    }

    set({
      notifications: [],
      notificationTimers: new Map(),
    });
  },
});

const createConfigActions = (set: (partial: Partial<UIState>) => void) => ({
  setGlobalLoading: (loading: boolean) => set({ globalLoading: loading }),
  setTheme: (theme: UIState['theme']) => set({ theme }),
  setLayout: (layout: UIState['layout']) => set({ layout }),
});

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      // Sidebar
      sidebarOpen: true,
      ...createSidebarActions(set),

      // Modals
      activeModal: null,
      modals: {
        settings: false,
        trade: false,
        deposit: false,
        withdraw: false,
      },
      ...createModalActions(set),

      // Notifications
      notifications: [],
      notificationTimers: new Map(),
      ...createNotificationActions(set, get),

      // Loading
      globalLoading: false,

      // Theme
      theme: 'system',

      // Layout
      layout: 'default',

      // Config actions
      ...createConfigActions(set),
    }),
    {
      name: 'ui-store',
    }
  )
);

// Persist theme to localStorage
if (typeof window !== 'undefined') {
  useUIStore.subscribe(state => {
    if (state.theme !== 'system') {
      localStorage.setItem('theme', state.theme);
    }
  });
}
