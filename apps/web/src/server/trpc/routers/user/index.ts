import { createTRPCRouter } from '../../init';

import { ordersRouter } from './orders';
import { profileRouter } from './profile';
import { securityRouter } from './security';

/**
 * User API роутер - объединяет все пользовательские операции
 */
export const userRouter = createTRPCRouter({
  // Профиль пользователя
  ...profileRouter._def.procedures,

  // Безопасность и аккаунт
  ...securityRouter._def.procedures,

  // Управление заявками
  ...ordersRouter._def.procedures,
});
