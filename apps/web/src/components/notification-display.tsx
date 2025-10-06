'use client';

import { useNotificationStore } from '@repo/hooks/src/client-hooks';
import { Notification } from '@repo/ui';

export function NotificationDisplay() {
  const { notifications, removeNotification } = useNotificationStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-md">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          variant={notification.type}
          title={notification.title}
          description={notification.description}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}
