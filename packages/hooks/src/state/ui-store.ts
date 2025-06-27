import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// UI State Store
interface UIState {
    // Sidebar
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;

    // Modals
    activeModal: string | null;
    openModal: (modalId: string) => void;
    closeModal: () => void;

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

    // Loading states
    globalLoading: boolean;
    setGlobalLoading: (loading: boolean) => void;

    // Layout
    layout: 'default' | 'compact' | 'wide';
    setLayout: (layout: UIState['layout']) => void;
}

export const useUIStore = create<UIState>()(
    devtools(
        (set, get) => ({
            // Sidebar
            sidebarOpen: true,
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            setSidebarOpen: (open) => set({ sidebarOpen: open }),

            // Modals
            activeModal: null,
            openModal: (modalId) => set({ activeModal: modalId }),
            closeModal: () => set({ activeModal: null }),

            // Notifications
            notifications: [],
            addNotification: (notification) => {
                const id = Math.random().toString(36).substr(2, 9);
                const timestamp = Date.now();
                set((state) => ({
                    notifications: [...state.notifications, { ...notification, id, timestamp }]
                }));

                // Auto-remove after 5 seconds
                setTimeout(() => {
                    get().removeNotification(id);
                }, 5000);
            },
            removeNotification: (id) => set((state) => ({
                notifications: state.notifications.filter(n => n.id !== id)
            })),

            // Loading
            globalLoading: false,
            setGlobalLoading: (loading) => set({ globalLoading: loading }),

            // Layout
            layout: 'default',
            setLayout: (layout) => set({ layout }),
        }),
        {
            name: 'ui-store',
        }
    )
);
