import { createTRPCRouter } from '../../init';

import { ordersRouter } from './orders';
import { profileRouter } from './profile';
import { securityRouter } from './security';

/**
 * User API роутер - объединяет все пользовательские операции
 *
 * Архитектура: namespace композиция вместо spread procedures
 * Использование: trpc.user.profile.getProfile.useQuery()
 *                trpc.user.security.changePassword.useMutation()
 *                trpc.user.orders.getMyOrders.useQuery()
 */
export const userRouter = createTRPCRouter({
  // Профиль пользователя - trpc.user.profile.*
  profile: profileRouter,

  // Безопасность и аккаунт - trpc.user.security.*
  security: securityRouter,

  // Управление заявками - trpc.user.orders.*
  orders: ordersRouter,
});
