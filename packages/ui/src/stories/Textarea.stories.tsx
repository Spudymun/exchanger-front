import type { Meta, StoryObj } from '@storybook/react';

import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

const meta: Meta<typeof Textarea> = {
  title: 'UI/Components/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Компонент многострочного поля ввода с поддержкой автоматического изменения размера и различных состояний.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
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
    rows: {
      control: 'number',
      description: 'Количество строк',
    },
    maxLength: {
      control: 'number',
      description: 'Максимальное количество символов',
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
        story: 'Базовое многострочное поле ввода с placeholder-подсказкой.',
      },
    },
  },
  args: {
    placeholder: 'Введите ваш текст...',
  },
};

export const WithLabel: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Многострочное поле с подписью для обеспечения правильной доступности и связи элементов.',
      },
    },
  },
  render: () => (
    <div className="space-y-2 w-80">
      <Label htmlFor="message">Сообщение</Label>
      <Textarea id="message" placeholder="Введите ваше сообщение..." />
    </div>
  ),
};

export const WithRows: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Многострочное поле с фиксированным количеством строк для контроля высоты.',
      },
    },
  },
  render: () => (
    <div className="space-y-2 w-80">
      <Label htmlFor="description">Описание</Label>
      <Textarea id="description" placeholder="Введите подробное описание..." rows={6} />
    </div>
  ),
};

export const WithMaxLength: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Многострочное поле с ограничением максимального количества символов.',
      },
    },
  },
  render: () => (
    <div className="space-y-2 w-80">
      <Label htmlFor="bio">Биография (до 200 символов)</Label>
      <Textarea id="bio" placeholder="Расскажите о себе..." maxLength={200} />
    </div>
  ),
};

export const Required: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Обязательное многострочное поле с визуальным индикатором (звездочка).',
      },
    },
  },
  render: () => (
    <div className="space-y-2 w-80">
      <Label htmlFor="feedback">
        Отзыв <span className="text-destructive">*</span>
      </Label>
      <Textarea id="feedback" placeholder="Поделитесь вашим мнением..." required />
    </div>
  ),
};

export const WithError: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Многострочное поле в состоянии ошибки с соответствующим индикатором и сообщением.',
      },
    },
  },
  render: () => (
    <div className="space-y-2 w-80">
      <Label htmlFor="error-field">Поле с ошибкой</Label>
      <Textarea
        id="error-field"
        placeholder="Это поле содержит ошибку"
        aria-invalid={true}
        defaultValue="Неверный контент"
      />
      <p className="text-sm text-destructive">Это поле обязательно для заполнения</p>
    </div>
  ),
};

export const Disabled: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Отключенное многострочное поле, недоступное для редактирования пользователем.',
      },
    },
  },
  render: () => (
    <div className="space-y-2 w-80">
      <Label htmlFor="disabled-field">Отключенное поле</Label>
      <Textarea
        id="disabled-field"
        placeholder="Это поле отключено"
        disabled
        defaultValue="Этот текст нельзя редактировать"
      />
    </div>
  ),
};

export const ResizableStates: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Демонстрация различных режимов изменения размера многострочного поля.',
      },
    },
  },
  render: () => (
    <div className="space-y-6 w-80">
      <div className="space-y-2">
        <Label>Стандартное изменение размера</Label>
        <Textarea placeholder="Можно изменять размер по вертикали и горизонтали" />
      </div>

      <div className="space-y-2">
        <Label>Только вертикальное изменение</Label>
        <Textarea placeholder="Можно изменять размер только по вертикали" className="resize-y" />
      </div>

      <div className="space-y-2">
        <Label>Без изменения размера</Label>
        <Textarea placeholder="Размер изменить нельзя" className="resize-none" />
      </div>
    </div>
  ),
};

export const DifferentSizes: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Демонстрация различных размеров многострочного поля по количеству строк.',
      },
    },
  },
  render: () => (
    <div className="space-y-6 w-80">
      <div className="space-y-2">
        <Label>Компактный (3 строки)</Label>
        <Textarea placeholder="Компактная область" rows={3} />
      </div>

      <div className="space-y-2">
        <Label>Стандартный (4 строки)</Label>
        <Textarea placeholder="Стандартная область" rows={4} />
      </div>

      <div className="space-y-2">
        <Label>Расширенный (8 строк)</Label>
        <Textarea placeholder="Расширенная область для большого количества текста" rows={8} />
      </div>
    </div>
  ),
};
