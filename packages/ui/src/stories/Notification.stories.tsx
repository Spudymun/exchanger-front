import type { Meta, StoryObj } from '@storybook/react';

import { Notification } from '../components/ui/notification';

const meta: Meta<typeof Notification> = {
  title: 'UI/Components/Notification',
  component: Notification,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Компонент для отображения уведомлений, предупреждений и сообщений об ошибках.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'success', 'warning', 'info'],
    },
    onClose: {
      action: 'closed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Информация',
    description: 'Это обычное информационное уведомление.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Успешно!',
    description: 'Операция завершена успешно.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Внимание',
    description: 'Пожалуйста, проверьте введенные данные.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Ошибка',
    description: 'Произошла ошибка при обработке запроса.',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Новое обновление',
    description: 'Доступна новая версия приложения.',
  },
};

export const WithCloseButton: Story = {
  args: {
    variant: 'info',
    title: 'Новое обновление',
    description: 'Доступна новая версия приложения.',
    onClose: () => {
      // Handle notification close in development
      void 0;
    },
  },
};

export const OnlyDescription: Story = {
  args: {
    variant: 'success',
    description: 'Данные сохранены.',
  },
};
