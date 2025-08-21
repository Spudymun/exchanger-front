'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@repo/ui';
import { ADMIN_ROUTES } from '@repo/constants';

export default function NotFound() {
  const router = useRouter();

  const handleBackClick = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-primary">404</h1>
          <h2 className="mt-6 text-3xl font-bold text-foreground">Страница не найдена</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Запрашиваемая страница не существует или была перемещена.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Button onClick={handleBackClick} variant="outline" className="w-full">
            ← Назад
          </Button>

          <Button asChild className="w-full">
            <Link href={ADMIN_ROUTES.ADMIN_HOME}>На главную админ-панели</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
