import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const meta: Meta<typeof Dialog> = {
  title: 'UI/Components/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Модальное окно на основе Radix UI с поддержкой доступности, анимаций и различных вариантов использования.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Состояние открытия диалога',
    },
    onOpenChange: {
      action: 'onOpenChange',
      description: 'Callback при изменении состояния',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Открыть диалог</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Базовый диалог</DialogTitle>
          <DialogDescription>
            Это простой пример диалогового окна с заголовком и описанием.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Основной контент диалога размещается здесь.</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Отмена</Button>
          </DialogClose>
          <Button>Подтвердить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Создать профиль</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создание профиля</DialogTitle>
          <DialogDescription>Заполните информацию для создания нового профиля.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Имя
            </Label>
            <Input id="name" placeholder="Иван Иванов" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" type="email" placeholder="ivan@example.com" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Имя пользователя
            </Label>
            <Input id="username" placeholder="ivan_user" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Отмена</Button>
          </DialogClose>
          <Button type="submit">Создать</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const Confirmation: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Удалить</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Подтверждение удаления</DialogTitle>
          <DialogDescription>
            Это действие нельзя будет отменить. Элемент будет удален навсегда.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Отмена</Button>
          </DialogClose>
          <Button variant="destructive">Удалить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const WithoutCloseButton: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Открыть без крестика</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Диалог без кнопки закрытия</DialogTitle>
          <DialogDescription>
            Этот диалог можно закрыть только через кнопки внизу или клавишу Escape.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Содержимое диалога, который требует явного выбора действия.</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Отмена</Button>
          </DialogClose>
          <Button>Согласен</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const Alert: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Показать уведомление</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Важное уведомление</DialogTitle>
          <DialogDescription>
            Обновление системы будет доступно через 5 минут. Рекомендуем сохранить вашу работу.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Понятно</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div className="space-y-4">
        <p>Открыт: {open ? 'Да' : 'Нет'}</p>
        <Button onClick={() => setOpen(true)}>Открыть управляемый диалог</Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Управляемый диалог</DialogTitle>
              <DialogDescription>Этот диалог управляется внешним состоянием.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p>Вы можете программно управлять открытием и закрытием этого диалога.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button onClick={() => setOpen(false)}>Готово</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  },
};

export const LongContent: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Длинный контент</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Диалог с длинным контентом</DialogTitle>
          <DialogDescription>
            Этот диалог демонстрирует поведение с длинным содержимым.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="p-4 border rounded">
              <h4 className="font-semibold mb-2">Секция {i + 1}</h4>
              <p>
                Это длинный текст, который демонстрирует поведение диалога с большим количеством
                контента. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Закрыть</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
