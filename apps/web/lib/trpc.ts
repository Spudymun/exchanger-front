import { createTRPCReact, type CreateTRPCReact } from '@trpc/react-query';

import type { AppRouter } from '../src/server/trpc/index.js';

export const trpc: CreateTRPCReact<AppRouter, unknown> = createTRPCReact<AppRouter>();
