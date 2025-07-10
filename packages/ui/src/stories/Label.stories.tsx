import type { Meta, StoryObj } from '@storybook/react';

import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const meta: Meta<typeof Label> = {
  title: 'UI/Components/Label',
  component: Label,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Компонент подписи для элементов формы с поддержкой доступности и состояний.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    htmlFor: {
      control: 'text',
      description: 'ID связанного элемента формы',
    },
    className: {
      control: 'text',
      description: 'Дополнительные CSS классы',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Базовая подпись для элементов формы.',
      },
    },
  },
  args: {
    children: 'Название поля',
  },
};

export const WithInput: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Подпись в связке с полем ввода для обеспечения правильной доступности и связи элементов.',
      },
    },
  },
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="username">Имя пользователя</Label>
      <Input id="username" placeholder="Введите имя пользователя" />
    </div>
  ),
};

export const Required: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Подпись для обязательного поля с визуальным индикатором (звездочка).',
      },
    },
  },
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="email-required">
        Email адрес
        <span className="text-destructive ml-1">*</span>
      </Label>
      <Input id="email-required" type="email" placeholder="example@email.com" required />
    </div>
  ),
};

export const WithDescription: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Подпись с дополнительным описанием для объяснения требований к полю.',
      },
    },
  },
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="password-desc">Пароль</Label>
      <Input id="password-desc" type="password" placeholder="Введите пароль" />
      <p className="text-xs text-muted-foreground">
        Минимум 8 символов, включая цифры и специальные символы
      </p>
    </div>
  ),
};

export const Disabled: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Подпись для отключенного поля с соответствующим визуальным состоянием.',
      },
    },
  },
  render: () => (
    <div className="group" data-disabled="true">
      <div className="space-y-2">
        <Label htmlFor="disabled-input">Отключенное поле</Label>
        <Input id="disabled-input" placeholder="Недоступно" disabled />
      </div>
    </div>
  ),
};

export const ErrorState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Подпись для поля в состоянии ошибки с соответствующим цветовым индикатором.',
      },
    },
  },
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="error-field" className="text-destructive">
        Поле с ошибкой
      </Label>
      <Input id="error-field" placeholder="Некорректное значение" aria-invalid={true} />
      <p className="text-sm text-destructive">Поле содержит ошибку</p>
    </div>
  ),
};

export const FormLabels: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Комплексный пример использования подписей в форме с различными типами полей и состояниями.',
      },
    },
  },
  render: () => (
    <div className="space-y-6 w-80">
      <div className="space-y-2">
        <Label htmlFor="form-name">
          Полное имя
          <span className="text-destructive">*</span>
        </Label>
        <Input id="form-name" placeholder="Иван Иванов" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="form-email">Email для уведомлений</Label>
        <Input id="form-email" type="email" placeholder="ivan@example.com" />
        <p className="text-xs text-muted-foreground">Будем присылать важные обновления</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="form-phone">Телефон (опционально)</Label>
        <Input id="form-phone" type="tel" placeholder="+7 (999) 123-45-67" />
      </div>
    </div>
  ),
};
