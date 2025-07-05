/**
 * API handlers for notifications
 * Выделенные обработчики для API уведомлений
 */
import { NotificationStore } from './state/notification-store.js';

export const createApiHandlers = (store: NotificationStore) => ({
  apiSuccess: (message: string) => store.success('Успешно', message),
  apiError: (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Произошла ошибка';
    store.error('Ошибка API', message);
  },
  apiLoading: (message: string) => store.info('Загрузка', message),
});

export const createExchangeHandlers = (store: NotificationStore) => ({
  orderCreated: (orderId: string) => 
    store.success('Заявка создана', `Заявка ${orderId} успешно создана`),
  orderCompleted: (orderId: string) => 
    store.success('Заявка завершена', `Заявка ${orderId} успешно обработана`),
  exchangeError: (error: string) => 
    store.error('Ошибка обмена', error),
});

export const createAuthHandlers = (store: NotificationStore) => ({
  loginSuccess: () => store.success('Вход выполнен', 'Добро пожаловать!'),
  loginError: () => store.error('Ошибка входа', 'Неверные учетные данные'),
  logoutSuccess: () => store.info('Выход выполнен', 'До свидания!'),
});
