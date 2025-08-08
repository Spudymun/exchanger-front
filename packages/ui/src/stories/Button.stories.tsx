import type { Meta, StoryObj } from '@storybook/react';
import { ChevronDown, Download, Heart, Mail, Plus, Search, Settings, Trash2 } from 'lucide-react';

import { Button } from '../components/ui/button';

const meta: Meta<typeof Button> = {
  title: 'UI/Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Universal button component with various variants, sizes, states and icon support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Button styling variant',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Отключить кнопку',
    },
    asChild: {
      control: 'boolean',
      description: 'Рендерить как дочерний элемент (Slot)',
    },
    children: {
      control: 'text',
      description: 'Содержимое кнопки',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Кнопка',
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Различные варианты оформления кнопок.',
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Различные размеры кнопок.',
      },
    },
  },
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button>
        <Mail />
        Отправить
      </Button>
      <Button variant="outline">
        <Download />
        Скачать
      </Button>
      <Button variant="destructive">
        <Trash2 />
        Удалить
      </Button>
      <Button variant="secondary">
        <Settings />
        Настройки
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Кнопки с иконками слева от текста.',
      },
    },
  },
};

export const IconOnly: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="icon" variant="default">
        <Heart />
      </Button>
      <Button size="icon" variant="outline">
        <Search />
      </Button>
      <Button size="icon" variant="destructive">
        <Trash2 />
      </Button>
      <Button size="icon" variant="ghost">
        <Settings />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Кнопки только с иконками без текста.',
      },
    },
  },
};

export const States: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Button>Активная</Button>
        <Button disabled>Отключенная</Button>
      </div>
      <div className="flex gap-4">
        <Button variant="outline">Активная outline</Button>
        <Button variant="outline" disabled>
          Отключенная outline
        </Button>
      </div>
      <div className="flex gap-4">
        <Button variant="destructive">Активная destructive</Button>
        <Button variant="destructive" disabled>
          Отключенная destructive
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Различные состояния кнопок - активные и отключенные.',
      },
    },
  },
};

export const LoadingState: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button disabled>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Загрузка...
      </Button>
      <Button variant="outline" disabled>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Обработка
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Состояние загрузки с спиннером.',
      },
    },
  },
};

export const ActionButtons: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm">
          <Plus />
          Создать
        </Button>
        <Button size="sm" variant="outline">
          <Download />
          Экспорт
        </Button>
        <Button size="sm" variant="ghost">
          <Settings />
        </Button>
      </div>

      <div className="flex gap-2">
        <Button>
          <Mail />
          Отправить письмо
        </Button>
        <Button variant="outline">
          <ChevronDown />
          Дополнительно
        </Button>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline">Отмена</Button>
        <Button>Сохранить</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Примеры использования кнопок в различных сценариях.',
      },
    },
  },
};

export const FullWidth: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Button className="w-full">Полная ширина</Button>
      <Button variant="outline" className="w-full">
        <Mail />С иконкой
      </Button>
      <Button variant="destructive" className="w-full">
        Удалить аккаунт
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Кнопки на полную ширину контейнера.',
      },
    },
  },
};

export const AsChild: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button asChild>
        <a href="#" onClick={e => e.preventDefault()}>
          Ссылка как кнопка
        </a>
      </Button>
      <Button variant="outline" asChild>
        <a href="#" onClick={e => e.preventDefault()}>
          <Download />
          Скачать файл
        </a>
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Использование Button как обертки для других элементов (например, ссылок).',
      },
    },
  },
};
