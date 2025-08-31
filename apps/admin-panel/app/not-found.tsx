'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, CenteredPageLayout } from '@repo/ui';
import { ADMIN_ROUTES } from '@repo/constants';

export default function NotFound() {
  const router = useRouter();

  const handleBackClick = () => {
    router.back();
  };

  return (
    <CenteredPageLayout
      maxWidth="md"
      heading="404"
      title="Страница не найдена"
      description="Запрашиваемая страница не существует или была перемещена."
    >
      <div className="space-y-4 w-full max-w-sm">
        <Button onClick={handleBackClick} variant="outline" className="w-full">
          ← Назад
        </Button>

        <Button asChild className="w-full">
          <Link href={ADMIN_ROUTES.ADMIN_HOME}>На главную админ-панели</Link>
        </Button>
      </div>
    </CenteredPageLayout>
  );
}
