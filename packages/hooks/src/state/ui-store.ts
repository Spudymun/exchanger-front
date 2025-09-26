import { THEME_MODES, type ThemeMode } from '@repo/constants';
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

  // ✅ НОВЫЕ поля для Enhanced Button Loading System
  buttonLoadingStates: Record<string, boolean>;
  setButtonLoading: (buttonId: string, loading: boolean) => void;
  clearAllButtonLoading: () => void;
  isAnyButtonLoading: () => boolean;

  // Theme
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

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
  setTheme: (theme: ThemeMode) => set({ theme }),
  setLayout: (layout: UIState['layout']) => set({ layout }),
});

export const useUIStore = createStore<UIState>('ui-store', (set, _get) => {
  return {
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

    // ✅ НОВЫЕ поля для Enhanced Button Loading System
    buttonLoadingStates: {},
    setButtonLoading: (buttonId: string, loading: boolean) =>
      set(state => ({
        buttonLoadingStates: {
          ...state.buttonLoadingStates,
          [buttonId]: loading,
        },
      })),
    clearAllButtonLoading: () => set({ buttonLoadingStates: {} }),
    isAnyButtonLoading: () => {
      const state = _get();
      return Object.values(state.buttonLoadingStates).some(Boolean);
    },

    // Theme - initialize from localStorage if available
    theme: THEME_MODES.SYSTEM, // Default value, will be updated by initialization

    // Layout
    layout: 'default',

    // Config actions
    ...createConfigActions(set),
  };
});

// Initialize theme from localStorage ONCE after store creation
if (typeof window !== 'undefined') {
  const storedTheme = localStorage.getItem('theme') as ThemeMode;

  if (
    storedTheme &&
    Object.values(THEME_MODES).includes(storedTheme) && // Only set if different from default to avoid unnecessary updates
    storedTheme !== THEME_MODES.SYSTEM
  ) {
    useUIStore.getState().setTheme(storedTheme);
  }
}

// Persist theme to localStorage - save ALL themes including system
if (typeof window !== 'undefined') {
  useUIStore.subscribe(state => {
    localStorage.setItem('theme', state.theme);
  });
}
