import { createTRPCRouter } from '../init';

import { adminRouter } from './admin';
import { authRouter } from './auth';
import { exchangeRouter } from './exchange';
import { userRouter } from './user';

export const appRouter = createTRPCRouter({
  exchange: exchangeRouter,
  auth: authRouter,
  user: userRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
