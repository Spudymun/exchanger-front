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

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      // Sidebar
      sidebarOpen: true,
      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: open => set({ sidebarOpen: open }),

      // Modals
      activeModal: null,
      modals: {
        settings: false,
        trade: false,
        deposit: false,
        withdraw: false,
      },
      openModal: modalId => set({ activeModal: modalId }),
      closeModal: () => set({ activeModal: null }),
      openSpecificModal: modal =>
        set(state => ({
          modals: { ...state.modals, [modal]: true },
        })),
      closeSpecificModal: modal =>
        set(state => ({
          modals: { ...state.modals, [modal]: false },
        })),

      // Notifications
      notifications: [],
      addNotification: notification => {
        const id = Math.random()
          .toString(UI_NUMERIC_CONSTANTS.ID_GENERATION_BASE)
          .substr(2, UI_NUMERIC_CONSTANTS.ID_GENERATION_LENGTH);
        const timestamp = Date.now();
        set(state => ({
          notifications: [...state.notifications, { ...notification, id, timestamp }],
        }));

        // Auto-remove after 5 seconds
        setTimeout(() => {
          get().removeNotification(id);
        }, UI_NUMERIC_CONSTANTS.NOTIFICATION_AUTO_REMOVE_TIMEOUT);
      },
      removeNotification: id =>
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id),
        })),
      clearNotifications: () => set({ notifications: [] }),

      // Loading
      globalLoading: false,
      setGlobalLoading: loading => set({ globalLoading: loading }),

      // Theme
      theme: 'system',
      setTheme: theme => set({ theme }),

      // Layout
      layout: 'default',
      setLayout: layout => set({ layout }),
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
