import { createStore } from '@repo/utils';

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

const createConfigActions = (set: (partial: Partial<UIState>) => void) => ({
  setGlobalLoading: (loading: boolean) => set({ globalLoading: loading }),
  setTheme: (theme: UIState['theme']) => set({ theme }),
  setLayout: (layout: UIState['layout']) => set({ layout }),
});

export const useUIStore = createStore<UIState>('ui-store', (set, _get) => ({
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

  // Notifications - УДАЛЕНЫ (используем notification-store.ts)

  // Loading
  globalLoading: false,

  // Theme
  theme: 'system',

  // Layout
  layout: 'default',

  // Config actions
  ...createConfigActions(set),
}));

// Persist theme to localStorage
if (typeof window !== 'undefined') {
  useUIStore.subscribe(state => {
    if (state.theme !== 'system') {
      localStorage.setItem('theme', state.theme);
    }
  });
}
