import { createTRPCRouter } from '../init';

import { authRouter } from './auth';
import { exchangeRouter } from './exchange';
import { fiatRouter } from './fiat';
import { operatorRouter } from './operator';
import { sharedRouter } from './shared';
import { supportRouter } from './support';
import { userRouter } from './user';

export const appRouter = createTRPCRouter({
  exchange: exchangeRouter,
  fiat: fiatRouter,
  auth: authRouter,
  user: userRouter,
  operator: operatorRouter,
  support: supportRouter,
  shared: sharedRouter,
});

export type AppRouter = typeof appRouter;
