import type { Preview } from '@storybook/nextjs-vite';
import '@repo/ui/styles';
import './storybook.css';

const preview: Preview = {
  parameters: {
    // Основные настройки контролов
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    // Конфигурация документации
    docs: {
      toc: true, // Table of Contents для навигации по документации
      story: {
        inline: true, // Встроенные stories в документации
      },
    },

    // Layout конфигурация
    layout: 'centered', // Центрирование компонентов по умолчанию

    // Viewport опции для responsive testing
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
      },
    },

    // Actions настройки (автоматически определяются для on* props)
    actions: {
      disable: false, // Включить actions для всех историй
    },

    // Backgrounds для тестирования на разных фонах
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1a1a1a',
        },
        {
          name: 'gray',
          value: '#f5f5f5',
        },
      ],
    },
  },

  // Глобальные декораторы для всех stories
  decorators: [
    // Layout wrapper декоратор
    Story => (
      <div className="storybook-wrapper min-h-screen bg-background text-foreground">
        <div className="p-4">
          <Story />
        </div>
      </div>
    ),

    // Theme декоратор для dark/light режимов
    (Story, context) => {
      const theme = context.globals.theme || 'light';

      return (
        <div className={theme === 'dark' ? 'dark' : ''}>
          <Story />
        </div>
      );
    },
  ],

  // Глобальные переменные (toolbar controls)
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'circlehollow', title: 'Light' },
          { value: 'dark', icon: 'circle', title: 'Dark' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Internationalization locale',
      defaultValue: 'uk',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'uk', title: 'Українська' },
          { value: 'en', title: 'English' },
          { value: 'ru', title: 'Русский' },
        ],
        showName: true,
      },
    },
  },
};

export default preview;
