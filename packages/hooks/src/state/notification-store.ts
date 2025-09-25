import { BUSINESS_LIMITS } from '@repo/constants';
import { createStore, createTimerActions, type TimerState } from '@repo/utils';
import { nanoid } from 'nanoid';

import {
  shouldShowNotification,
  getDefaultCategory,
  logFilteredNotification,
} from '../utils/notification-filter';

// Типы уведомлений
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Новые типы для категоризации уведомлений
export type NotificationCategory = 'ui' | 'business' | 'system' | 'error';
export type NotificationSource =
  | 'theme'
  | 'exchange'
  | 'auth'
  | 'api'
  | 'form'
  | 'wallet'
  | 'sidebar'
  | 'modal'
  | 'order'
  | 'validation'
  | 'network'
  | 'server';

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
  // Новые поля для категоризации уведомлений
  category?: NotificationCategory; // Optional для обратной совместимости
  source?: NotificationSource; // Optional для обратной совместимости
}

export interface NotificationStore extends TimerState {
  notifications: Notification[];

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Convenience methods
  success: (
    title: string,
    description?: string,
    options?: Partial<
      Pick<Notification, 'duration' | 'action' | 'persistent' | 'category' | 'source'>
    >
  ) => string;
  error: (
    title: string,
    description?: string,
    options?: Partial<
      Pick<Notification, 'duration' | 'action' | 'persistent' | 'category' | 'source'>
    >
  ) => string;
  warning: (
    title: string,
    description?: string,
    options?: Partial<
      Pick<Notification, 'duration' | 'action' | 'persistent' | 'category' | 'source'>
    >
  ) => string;
  info: (
    title: string,
    description?: string,
    options?: Partial<
      Pick<Notification, 'duration' | 'action' | 'persistent' | 'category' | 'source'>
    >
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
    // Применяем категорию по умолчанию если не указана
    const category = notification.category || getDefaultCategory(notification.type);

    // Проверяем, разрешено ли показывать это уведомление
    if (!shouldShowNotification(category, notification.source)) {
      logFilteredNotification(category, notification.source, notification.title);
      return 'filtered'; // Возвращаем специальный ID для отфильтрованных уведомлений
    }

    const id = nanoid();
    const newNotification: Notification = {
      id,
      createdAt: Date.now(),
      duration: notification.duration ?? DEFAULT_DURATION,
      category, // Устанавливаем категорию
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

      // Используем централизованный timer management
      const timerActions = createTimerActions(set, get);
      timerActions.setTimer(id, timerId);
    }

    return id;
  };

// Функция для создания cleanup действий
const createCleanupActions = (
  set: (fn: (state: NotificationStore) => Partial<NotificationStore>) => void,
  get: () => NotificationStore
) => ({
  removeNotification: (id: string) => {
    // Используем централизованный timer cleanup
    const timerActions = createTimerActions(set, get);
    timerActions.clearTimer(id);

    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },

  clearNotifications: () => {
    // Используем централизованный timer cleanup
    const timerActions = createTimerActions(set, get);
    timerActions.clearAllTimers();

    set(() => ({
      notifications: [],
    }));
  },
});

// Функция для создания convenience методов
const createConvenienceMethods = (get: () => NotificationStore) => ({
  success: (
    title: string,
    description?: string,
    options?: Partial<
      Pick<Notification, 'duration' | 'action' | 'persistent' | 'category' | 'source'>
    >
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
    options?: Partial<
      Pick<Notification, 'duration' | 'action' | 'persistent' | 'category' | 'source'>
    >
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
    options?: Partial<
      Pick<Notification, 'duration' | 'action' | 'persistent' | 'category' | 'source'>
    >
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
    options?: Partial<
      Pick<Notification, 'duration' | 'action' | 'persistent' | 'category' | 'source'>
    >
  ) => {
    return get().addNotification({
      type: 'info',
      title,
      description,
      ...options,
    });
  },
});

export const useNotificationStore = createStore<NotificationStore>(
  'notification-store',
  (set, get) => ({
    notifications: [],
    timers: new Map(),
    maxNotifications: MAX_NOTIFICATIONS,
    defaultDuration: DEFAULT_DURATION,

    // Actions
    addNotification: createAddNotificationAction(set, get),
    ...createCleanupActions(set, get),
    ...createConvenienceMethods(get),
  })
);

// Селекторы для оптимизации
export const selectNotifications = (state: NotificationStore) => state.notifications;
export const selectNotificationCount = (state: NotificationStore) => state.notifications.length;
export const selectNotificationsByType = (type: NotificationType) => (state: NotificationStore) =>
  state.notifications.filter(n => n.type === type);
export const selectNotificationsByCategory =
  (category: NotificationCategory) => (state: NotificationStore) =>
    state.notifications.filter(n => n.category === category);
