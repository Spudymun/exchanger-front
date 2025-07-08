import { BUSINESS_LIMITS } from '@repo/constants';
import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// Типы уведомлений
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  duration?: number; // в миллисекундах, null = постоянное
  action?: NotificationAction;
  persistent?: boolean; // не удаляется автоматически
  createdAt: number;
}

export interface NotificationStore {
  notifications: Notification[];
  notificationTimers: Map<string, NodeJS.Timeout>; // Добавляем для cleanup

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Convenience methods
  success: (
    title: string,
    description?: string,
    options?: Partial<Pick<Notification, 'duration' | 'action' | 'persistent'>>
  ) => string;
  error: (
    title: string,
    description?: string,
    options?: Partial<Pick<Notification, 'duration' | 'action' | 'persistent'>>
  ) => string;
  warning: (
    title: string,
    description?: string,
    options?: Partial<Pick<Notification, 'duration' | 'action' | 'persistent'>>
  ) => string;
  info: (
    title: string,
    description?: string,
    options?: Partial<Pick<Notification, 'duration' | 'action' | 'persistent'>>
  ) => string;

  // Configuration
  maxNotifications: number;
  defaultDuration: number;
}

// Дефолтные значения из централизованных констант
const DEFAULT_DURATION = BUSINESS_LIMITS.DEFAULT_NOTIFICATION_DURATION_MS;
const MAX_NOTIFICATIONS = BUSINESS_LIMITS.MAX_NOTIFICATIONS;
const ERROR_DURATION = BUSINESS_LIMITS.ERROR_NOTIFICATION_DURATION_MS;
const WARNING_DURATION = BUSINESS_LIMITS.WARNING_NOTIFICATION_DURATION_MS;

// Функция для создания основных действий (разделена для соблюдения max-lines-per-function)
const createAddNotificationAction =
  (
    set: (fn: (state: NotificationStore) => Partial<NotificationStore>) => void,
    get: () => NotificationStore
  ) =>
  (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const id = nanoid();
    const newNotification: Notification = {
      id,
      createdAt: Date.now(),
      duration: notification.duration ?? DEFAULT_DURATION,
      ...notification,
    };

    set(state => {
      const notifications = [...state.notifications, newNotification];

      // Ограничиваем количество уведомлений - исправляем мутацию
      const limitedNotifications =
        notifications.length > state.maxNotifications
          ? notifications.slice(1) // Создаем новый массив без первого элемента
          : notifications;

      return { notifications: limitedNotifications };
    });

    // Автоматическое удаление через duration (если не persistent) с cleanup
    if (!notification.persistent && newNotification.duration !== null) {
      const timerId = setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);

      // Сохраняем timerId для возможности cleanup
      set(state => {
        const newTimers = new Map(state.notificationTimers);
        newTimers.set(id, timerId);
        return { notificationTimers: newTimers };
      });
    }

    return id;
  };

// Функция для создания cleanup действий
const createCleanupActions = (
  set: (fn: (state: NotificationStore) => Partial<NotificationStore>) => void,
  get: () => NotificationStore
) => ({
  removeNotification: (id: string) => {
    // Очищаем таймер при ручном удалении
    const timers = get().notificationTimers;
    const timerId = timers.get(id);
    if (timerId) {
      clearTimeout(timerId);
    }

    set(state => {
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

    set(() => ({
      notifications: [],
      notificationTimers: new Map(),
    }));
  },
});

// Функция для создания convenience методов
const createConvenienceMethods = (get: () => NotificationStore) => ({
  success: (
    title: string,
    description?: string,
    options?: Partial<Pick<Notification, 'duration' | 'action' | 'persistent'>>
  ) => {
    return get().addNotification({
      type: 'success',
      title,
      description,
      ...options,
    });
  },

  error: (
    title: string,
    description?: string,
    options?: Partial<Pick<Notification, 'duration' | 'action' | 'persistent'>>
  ) => {
    return get().addNotification({
      type: 'error',
      title,
      description,
      duration: options?.duration ?? ERROR_DURATION, // Ошибки показываем дольше
      ...options,
    });
  },

  warning: (
    title: string,
    description?: string,
    options?: Partial<Pick<Notification, 'duration' | 'action' | 'persistent'>>
  ) => {
    return get().addNotification({
      type: 'warning',
      title,
      description,
      duration: options?.duration ?? WARNING_DURATION, // Предупреждения показываем дольше
      ...options,
    });
  },

  info: (
    title: string,
    description?: string,
    options?: Partial<Pick<Notification, 'duration' | 'action' | 'persistent'>>
  ) => {
    return get().addNotification({
      type: 'info',
      title,
      description,
      ...options,
    });
  },
});

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      notifications: [],
      notificationTimers: new Map(),
      maxNotifications: MAX_NOTIFICATIONS,
      defaultDuration: DEFAULT_DURATION,

      // Actions
      addNotification: createAddNotificationAction(set, get),
      ...createCleanupActions(set, get),
      ...createConvenienceMethods(get),
    })),
    {
      name: 'notification-store',
      version: 1,
    }
  )
);

// Селекторы для оптимизации
export const selectNotifications = (state: NotificationStore) => state.notifications;
export const selectNotificationCount = (state: NotificationStore) => state.notifications.length;
export const selectNotificationsByType = (type: NotificationType) => (state: NotificationStore) =>
  state.notifications.filter(n => n.type === type);
