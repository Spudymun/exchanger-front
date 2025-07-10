import type { Meta, StoryObj } from '@storybook/react';

import { Spinner } from '../components/ui/spinner';

const meta: Meta<typeof Spinner> = {
  title: 'UI/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Индикатор загрузки для отображения процесса выполнения операций.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'xl'],
    },
    variant: {
      control: 'select',
      options: [
        'default',
        'secondary',
        'muted',
        'accent',
        'destructive',
        'success',
        'warning',
        'info',
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: 'default',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    size: 'default',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    size: 'default',
  },
};

export const InButton: Story = {
  render: () => (
    <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md">
      <Spinner size="sm" className="mr-2" />
      Загрузка...
    </button>
  ),
};

export const Centered: Story = {
  render: () => (
    <div className="flex items-center justify-center h-32 w-64 border border-dashed border-gray-300 rounded-lg">
      <Spinner size="lg" />
    </div>
  ),
};
