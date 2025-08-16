'use client';

import { Button } from '@repo/ui';
import { useState } from 'react';

/**
 * Компонент для тестирования Error Boundaries
 * Намеренно бросает ошибку при нажатии на кнопку
 */
export function ErrorBoundaryTest() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Тестовая ошибка для проверки Error Boundary');
  }

  return (
    <div className="p-4 border border-border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Тест Error Boundary</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Нажмите кнопку чтобы намеренно вызвать ошибку
      </p>
      <Button onClick={() => setShouldThrow(true)} variant="destructive">
        Вызвать ошибку
      </Button>
    </div>
  );
}
