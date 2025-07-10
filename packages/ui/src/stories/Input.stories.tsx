import type { Meta, StoryObj } from '@storybook/react';

import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const meta: Meta<typeof Input> = {
  title: 'UI/Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Компонент поля ввода с поддержкой различных типов, валидации и состояний.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
      description: 'Тип поля ввода',
    },
    placeholder: {
      control: 'text',
      description: 'Текст-подсказка',
    },
    disabled: {
      control: 'boolean',
      description: 'Отключить поле',
    },
    required: {
      control: 'boolean',
      description: 'Обязательное поле',
    },
    'aria-invalid': {
      control: 'boolean',
      description: 'Состояние ошибки',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Базовое поле ввода текста с placeholder-подсказкой.',
      },
    },
  },
  args: {
    placeholder: 'Введите текст...',
  },
};

export const WithLabel: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Поле ввода с подписью для лучшей доступности и понимания назначения поля.',
      },
    },
  },
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="email">Email адрес</Label>
      <Input id="email" type="email" placeholder="example@email.com" />
    </div>
  ),
};

export const Password: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Поле ввода пароля с автоматическим скрытием символов для безопасности.',
      },
    },
  },
  args: {
    type: 'password',
    placeholder: 'Введите пароль',
  },
};

export const Number: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Числовое поле ввода с возможностью установки минимального и максимального значений.',
      },
    },
  },
  args: {
    type: 'number',
    placeholder: '0',
    min: 0,
    max: 100,
  },
};

export const Error: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Поле ввода в состоянии ошибки с соответствующим индикатором и сообщением.',
      },
    },
  },
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="error-input">Поле с ошибкой</Label>
      <Input id="error-input" placeholder="Некорректное значение" aria-invalid={true} />
      <p className="text-sm text-destructive">Поле содержит ошибку</p>
    </div>
  ),
};

export const Disabled: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Отключенное поле ввода, недоступное для редактирования пользователем.',
      },
    },
  },
  args: {
    placeholder: 'Отключенное поле',
    disabled: true,
    value: 'Нельзя редактировать',
  },
};

export const Search: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Поле поиска с соответствующим типом и семантикой для поисковых запросов.',
      },
    },
  },
  args: {
    type: 'search',
    placeholder: 'Поиск...',
  },
};

export const FileUpload: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Поле загрузки файлов с соответствующим типом и подписью.',
      },
    },
  },
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="file">Загрузить файл</Label>
      <Input id="file" type="file" />
    </div>
  ),
};

export const FormGroup: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Группа полей формы, демонстрирующая различные типы полей ввода в едином контексте.',
      },
    },
  },
  render: () => (
    <div className="space-y-4 w-80">
      <div className="space-y-2">
        <Label htmlFor="name">Имя *</Label>
        <Input id="name" placeholder="Введите имя" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email-form">Email *</Label>
        <Input id="email-form" type="email" placeholder="example@email.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Телефон</Label>
        <Input id="phone" type="tel" placeholder="+7 (999) 123-45-67" />
      </div>
    </div>
  ),
};
