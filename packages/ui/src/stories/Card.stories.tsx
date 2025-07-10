import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
  CardAction,
} from '../components/ui/card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Универсальный компонент карточки для отображения контента с поддержкой заголовка, описания, действий и футера.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Дополнительные CSS классы',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Базовая карточка</CardTitle>
        <CardDescription>Простая карточка с заголовком и описанием</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Основной контент карточки размещается здесь.</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Карточка с футером</CardTitle>
        <CardDescription>Карточка с дополнительными действиями в футере</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Контент карточки с дополнительными элементами управления.</p>
      </CardContent>
      <CardFooter className="border-t">
        <Button variant="outline" className="mr-2">
          Отмена
        </Button>
        <Button>Сохранить</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Карточка с действием</CardTitle>
        <CardDescription>Карточка с кнопкой действия в заголовке</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon">
            ⋯
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>Основной контент с дополнительным действием в заголовке.</p>
      </CardContent>
    </Card>
  ),
};

export const Dashboard: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Статистика</CardTitle>
        <CardDescription>Актуальные данные</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">$12,345.67</div>
        <p className="text-sm text-green-600">+5.2% от прошлого месяца</p>
      </CardContent>
    </Card>
  ),
};

export const Complex: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Комплексная карточка</CardTitle>
        <CardDescription>Карточка со всеми возможными элементами</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon">
            ⚙️
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Функции:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Заголовок и описание</li>
            <li>• Действия в заголовке</li>
            <li>• Структурированный контент</li>
            <li>• Футер с кнопками</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="border-t">
        <Button variant="secondary" className="mr-auto">
          Подробнее
        </Button>
        <Button variant="outline" className="mr-2">
          Редактировать
        </Button>
        <Button>Применить</Button>
      </CardFooter>
    </Card>
  ),
};
