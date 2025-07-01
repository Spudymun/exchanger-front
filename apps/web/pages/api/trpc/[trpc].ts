import { createNextApiHandler } from '@trpc/server/adapters/next';

import { appRouter } from '../../../src/server/trpc';
import { createContext } from '../../../src/server/trpc/context';

// Обработчик API для Next.js
export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError: ({ path, error }) => {
    console.error(`❌ tRPC failed on ${path ?? '<no-path>'}:`, error);
  },
});
