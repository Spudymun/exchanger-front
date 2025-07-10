import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../components/ui/button';
import { FormField, FormLabel, FormControl, FormMessage } from '../components/ui/form';
import { Input } from '../components/ui/input';

const meta: Meta<typeof FormField> = {
  title: 'UI/Form',
  component: FormField,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Комплект компонентов для построения форм с валидацией и доступностью.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <FormField name="email" required>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input placeholder="example@email.com" />
      </FormControl>
      <FormMessage>Введите корректный email адрес</FormMessage>
    </FormField>
  ),
};

export const WithError: Story = {
  render: () => (
    <FormField name="password" error="Пароль должен содержать минимум 8 символов" required>
      <FormLabel>Пароль</FormLabel>
      <FormControl>
        <Input type="password" placeholder="Введите пароль" />
      </FormControl>
      <FormMessage />
    </FormField>
  ),
};

export const FormExample: Story = {
  render: () => (
    <form className="space-y-4 w-80">
      <FormField name="name" required>
        <FormLabel>Имя</FormLabel>
        <FormControl>
          <Input placeholder="Ваше имя" />
        </FormControl>
      </FormField>

      <FormField name="email" required>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input type="email" placeholder="example@email.com" />
        </FormControl>
      </FormField>

      <FormField name="password" required>
        <FormLabel>Пароль</FormLabel>
        <FormControl>
          <Input type="password" placeholder="Создайте пароль" />
        </FormControl>
        <FormMessage>Минимум 8 символов, включая цифры и буквы</FormMessage>
      </FormField>

      <Button type="submit" className="w-full">
        Зарегистрироваться
      </Button>
    </form>
  ),
};
