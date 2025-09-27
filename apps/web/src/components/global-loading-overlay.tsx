'use client';

import { useEffect, useState } from 'react';

import Loading from '../../app/[locale]/loading';
import { trpc } from '../../lib/trpc-provider';

/**
 * Глобальный оверлей загрузки который показывается при обновлении страницы
 * до тех пор пока основные данные не загрузятся.
 * Переиспользует компонент Loading из apps/web/app/[locale]/loading.tsx
 */
export function GlobalLoadingOverlay() {
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Отслеживаем загрузку основных данных которые нужны для отображения страницы
  const sessionQuery = trpc.auth.getSession.useQuery();

  useEffect(() => {
    // Когда основные данные загрузились или произошла ошибка, убираем лоадер
    if (!sessionQuery.isLoading) {
      setIsInitialLoad(false);
    }
  }, [sessionQuery.isLoading]);

  // Показываем лоадер только при первой загрузке и пока данные грузятся
  if (!isInitialLoad) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <Loading />
    </div>
  );
}
