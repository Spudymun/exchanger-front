import type { Meta, StoryObj } from '@storybook/react';

import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '../components/ui/select';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Компонент выпадающего списка на основе Radix UI с поддержкой групп, поиска и кастомизации.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Отключить выбор',
    },
    required: {
      control: 'boolean',
      description: 'Обязательное поле',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Выберите опцию" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Яблоко</SelectItem>
        <SelectItem value="banana">Банан</SelectItem>
        <SelectItem value="orange">Апельсин</SelectItem>
        <SelectItem value="grape">Виноград</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="fruit-select">Выберите фрукт</Label>
      <Select>
        <SelectTrigger className="w-48" id="fruit-select">
          <SelectValue placeholder="Выберите фрукт" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">🍎 Яблоко</SelectItem>
          <SelectItem value="banana">🍌 Банан</SelectItem>
          <SelectItem value="orange">🍊 Апельсин</SelectItem>
          <SelectItem value="grape">🍇 Виноград</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Выберите продукт" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Фрукты</SelectLabel>
          <SelectItem value="apple">Яблоко</SelectItem>
          <SelectItem value="banana">Банан</SelectItem>
          <SelectItem value="orange">Апельсин</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Овощи</SelectLabel>
          <SelectItem value="carrot">Морковь</SelectItem>
          <SelectItem value="potato">Картофель</SelectItem>
          <SelectItem value="tomato">Помидор</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Ягоды</SelectLabel>
          <SelectItem value="strawberry">Клубника</SelectItem>
          <SelectItem value="blueberry">Черника</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const SmallSize: Story = {
  render: () => (
    <Select>
      <SelectTrigger size="sm" className="w-40">
        <SelectValue placeholder="Размер SM" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="xs">XS</SelectItem>
        <SelectItem value="sm">SM</SelectItem>
        <SelectItem value="md">MD</SelectItem>
        <SelectItem value="lg">LG</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Недоступно для выбора" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="item1">Недоступно</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const DisabledItems: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Некоторые опции недоступны" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="available1">Доступно</SelectItem>
        <SelectItem value="disabled1" disabled>
          Недоступно
        </SelectItem>
        <SelectItem value="available2">Доступно</SelectItem>
        <SelectItem value="disabled2" disabled>
          Недоступно
        </SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Currency: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="currency">Валюта</Label>
      <Select>
        <SelectTrigger className="w-48" id="currency">
          <SelectValue placeholder="Выберите валюту" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="usd">🇺🇸 USD - Доллар США</SelectItem>
          <SelectItem value="eur">🇪🇺 EUR - Евро</SelectItem>
          <SelectItem value="rub">🇷🇺 RUB - Российский рубль</SelectItem>
          <SelectItem value="gbp">🇬🇧 GBP - Фунт стерлингов</SelectItem>
          <SelectItem value="jpy">🇯🇵 JPY - Японская иена</SelectItem>
          <SelectItem value="cny">🇨🇳 CNY - Китайский юань</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <div className="space-y-2">
        <Label htmlFor="country">Страна</Label>
        <Select>
          <SelectTrigger id="country">
            <SelectValue placeholder="Выберите страну" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ru">Россия</SelectItem>
            <SelectItem value="us">США</SelectItem>
            <SelectItem value="de">Германия</SelectItem>
            <SelectItem value="fr">Франция</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">Язык интерфейса</Label>
        <Select>
          <SelectTrigger id="language">
            <SelectValue placeholder="Выберите язык" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ru">Русский</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="de">Deutsch</SelectItem>
            <SelectItem value="fr">Français</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Часовой пояс</Label>
        <Select>
          <SelectTrigger id="timezone">
            <SelectValue placeholder="Выберите часовой пояс" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Россия</SelectLabel>
              <SelectItem value="msk">MSK (UTC+3)</SelectItem>
              <SelectItem value="spb">SPB (UTC+3)</SelectItem>
              <SelectItem value="nsk">NSK (UTC+7)</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Европа</SelectLabel>
              <SelectItem value="cet">CET (UTC+1)</SelectItem>
              <SelectItem value="eet">EET (UTC+2)</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
};
