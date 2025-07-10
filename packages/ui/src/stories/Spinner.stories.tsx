import type { Meta, StoryObj } from '@storybook/react';

import { Spinner } from '../components/ui/spinner';

const meta: Meta<typeof Spinner> = {
  title: 'UI/Components/Spinner',
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
      description: 'Размер спиннера',
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
      description: 'Цветовой вариант спиннера',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Базовый спиннер стандартного размера для индикации загрузки.',
      },
    },
  },
  args: {
    size: 'default',
  },
};

export const Small: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Компактный спиннер для использования в небольших компонентах.',
      },
    },
  },
  args: {
    size: 'sm',
  },
};

export const Large: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Увеличенный спиннер для основных элементов загрузки.',
      },
    },
  },
  args: {
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Самый крупный спиннер для полноэкранных загрузок и основных операций.',
      },
    },
  },
  args: {
    size: 'xl',
  },
};

export const Success: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Спиннер с зеленым цветом для индикации успешных операций.',
      },
    },
  },
  args: {
    variant: 'success',
    size: 'default',
  },
};

export const Warning: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Спиннер с желтым цветом для предупреждающих операций.',
      },
    },
  },
  args: {
    variant: 'warning',
    size: 'default',
  },
};

export const Error: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Спиннер с красным цветом для индикации ошибочных операций.',
      },
    },
  },
  args: {
    variant: 'destructive',
    size: 'default',
  },
};

export const Disabled: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Скрытый спиннер с использованием параметра show=false.',
      },
    },
  },
  args: {
    show: false,
    size: 'default',
  },
};

export const InButton: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Спиннер внутри кнопки для индикации состояния загрузки действия.',
      },
    },
  },
  render: () => (
    <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md">
      <Spinner size="sm" className="mr-2" />
      Загрузка...
    </button>
  ),
};

export const Centered: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Центрированный спиннер в контейнере для полноэкранных загрузок.',
      },
    },
  },
  render: () => (
    <div className="flex items-center justify-center h-32 w-64 border border-dashed border-gray-300 rounded-lg">
      <Spinner size="lg" />
    </div>
  ),
};
