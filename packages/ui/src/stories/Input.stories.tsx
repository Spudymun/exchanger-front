import type { Meta, StoryObj } from '@storybook/react';

import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
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
  args: {
    placeholder: 'Введите текст...',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="email">Email адрес</Label>
      <Input id="email" type="email" placeholder="example@email.com" />
    </div>
  ),
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Введите пароль',
  },
};

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: '0',
    min: 0,
    max: 100,
  },
};

export const Error: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="error-input">Поле с ошибкой</Label>
      <Input id="error-input" placeholder="Некорректное значение" aria-invalid={true} />
      <p className="text-sm text-destructive">Поле содержит ошибку</p>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    placeholder: 'Отключенное поле',
    disabled: true,
    value: 'Нельзя редактировать',
  },
};

export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Поиск...',
  },
};

export const FileUpload: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="file">Загрузить файл</Label>
      <Input id="file" type="file" />
    </div>
  ),
};

export const FormGroup: Story = {
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
