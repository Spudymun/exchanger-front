import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { FooterCompound as Footer } from '../components/footer-compound';

const meta: Meta<typeof Footer> = {
  title: 'UI/Organisms/Footer',
  component: Footer,
  parameters: {
    docs: {
      description: {
        component: `
Footer compound component с поддержкой темизации и гибкой композиции.
Использует Context API для автоматического enhancement дочерних компонентов.
Включает support для социальных ссылок, правовой информации и layout вариантов.
        `,
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    theme: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Цветовая тема footer',
    },
    companyName: {
      control: 'text',
      description: 'Название компании для copyright',
    },
    isCompact: {
      control: 'boolean',
      description: 'Компактный режим отображения',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Базовые данные для демонстрации
const mockSocialLinks = [
  {
    name: 'Telegram',
    href: 'https://t.me/exchangego',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z" />
      </svg>
    ),
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com/exchangego',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
      </svg>
    ),
  },
];

const mockLegalLinks = [
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Terms of Service', href: '/terms' },
  { name: 'AML Policy', href: '/aml' },
];

// Default состояние
export const Default: Story = {
  args: {
    companyName: 'ExchangeGO',
    theme: 'light',
  },
  render: (args: Story['args']) => (
    <Footer {...args}>
      <Footer.Container variant="grid" columns="four">
        <Footer.Section title="Company">
          <p className="text-sm text-muted-foreground mb-2">
            Secure cryptocurrency exchange platform with competitive rates.
          </p>
          <Footer.Social links={mockSocialLinks} />
        </Footer.Section>

        <Footer.Section title="Exchange">
          <Footer.Link href="/rates">Exchange Rates</Footer.Link>
          <Footer.Link href="/reserves">Reserves</Footer.Link>
          <Footer.Link href="/limits">Limits</Footer.Link>
        </Footer.Section>

        <Footer.Section title="Support">
          <Footer.Link href="/faq">FAQ</Footer.Link>
          <Footer.Link href="/contact">Contact</Footer.Link>
          <Footer.Link href="/help">Help Center</Footer.Link>
        </Footer.Section>

        <Footer.Section title="Legal">
          <Footer.Link href="/privacy">Privacy Policy</Footer.Link>
          <Footer.Link href="/terms">Terms of Service</Footer.Link>
          <Footer.Link href="/aml">AML Policy</Footer.Link>
        </Footer.Section>
      </Footer.Container>

      <Footer.Legal links={mockLegalLinks} />
    </Footer>
  ),
};

// Dark Theme
export const DarkTheme: Story = {
  args: {
    companyName: 'ExchangeGO',
    theme: 'dark',
  },
  render: (args: Story['args']) => (
    <div className="bg-background p-8">
      <Footer {...args}>
        <Footer.Container variant="grid" columns="three">
          <Footer.Section title="Company">
            <Footer.CompanyInfo
              description="Professional crypto exchange"
              address="123 Crypto Street"
              email="support@exchangego.com"
            />
          </Footer.Section>

          <Footer.Section title="Quick Links">
            <Footer.Link href="/exchange">Exchange</Footer.Link>
            <Footer.Link href="/wallet">Wallet</Footer.Link>
            <Footer.Link href="/api">API</Footer.Link>
          </Footer.Section>

          <Footer.Section title="Connect">
            <Footer.Social links={mockSocialLinks} />
          </Footer.Section>
        </Footer.Container>

        <Footer.Legal links={mockLegalLinks} />
      </Footer>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dark theme version с компактным layout',
      },
    },
  },
};

// Compact Mode
export const Compact: Story = {
  args: {
    companyName: 'ExchangeGO',
    isCompact: true,
  },
  render: (args: Story['args']) => (
    <Footer {...args}>
      <Footer.Container variant="flex">
        <Footer.Section>
          <div className="flex items-center space-x-4">
            <span className="text-sm">© 2025 ExchangeGO</span>
            <Footer.Link href="/privacy">Privacy</Footer.Link>
            <Footer.Link href="/terms">Terms</Footer.Link>
          </div>
        </Footer.Section>

        <Footer.Section>
          <Footer.Social links={mockSocialLinks.slice(0, 2)} />
        </Footer.Section>
      </Footer.Container>
    </Footer>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Компактная версия для минималистичных layout',
      },
    },
  },
};

// With External Links
export const WithExternalLinks: Story = {
  args: {
    companyName: 'ExchangeGO',
  },
  render: (args: Story['args']) => (
    <Footer {...args}>
      <Footer.Container variant="grid" columns="two">
        <Footer.Section title="Internal">
          <Footer.Link href="/about">About Us</Footer.Link>
          <Footer.Link href="/contact">Contact</Footer.Link>
        </Footer.Section>

        <Footer.Section title="External">
          <Footer.Link href="https://blog.exchangego.com" external>
            Blog
          </Footer.Link>
          <Footer.Link href="https://status.exchangego.com" external>
            Status Page
          </Footer.Link>
        </Footer.Section>
      </Footer.Container>
    </Footer>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Демонстрация внутренних и внешних ссылок с proper handling',
      },
    },
  },
};

// All Layout Variants
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8">
      {/* Grid Layout */}
      <div className="border rounded p-4">
        <h3 className="mb-4">Grid Layout (4 columns)</h3>
        <Footer companyName="ExchangeGO">
          <Footer.Container variant="grid" columns="four">
            <Footer.Section title="Col 1">
              <Footer.Link href="/link1">Link 1</Footer.Link>
            </Footer.Section>
            <Footer.Section title="Col 2">
              <Footer.Link href="/link2">Link 2</Footer.Link>
            </Footer.Section>
            <Footer.Section title="Col 3">
              <Footer.Link href="/link3">Link 3</Footer.Link>
            </Footer.Section>
            <Footer.Section title="Col 4">
              <Footer.Link href="/link4">Link 4</Footer.Link>
            </Footer.Section>
          </Footer.Container>
        </Footer>
      </div>

      {/* Flex Layout */}
      <div className="border rounded p-4">
        <h3 className="mb-4">Flex Layout</h3>
        <Footer companyName="ExchangeGO">
          <Footer.Container variant="flex">
            <Footer.Section>
              <span>Left Content</span>
            </Footer.Section>
            <Footer.Section>
              <span>Right Content</span>
            </Footer.Section>
          </Footer.Container>
        </Footer>
      </div>

      {/* Simple Layout */}
      <div className="border rounded p-4">
        <h3 className="mb-4">Simple Layout</h3>
        <Footer companyName="ExchangeGO">
          <Footer.Container variant="simple">
            <Footer.Section title="Simple Footer">
              <p>Minimal footer content</p>
            </Footer.Section>
          </Footer.Container>
        </Footer>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Все доступные layout варианты для быстрого сравнения',
      },
    },
  },
};

// Full Example
export const FullExample: Story = {
  args: {
    companyName: 'ExchangeGO',
    theme: 'light',
  },
  render: (args: Story['args']) => (
    <Footer {...args}>
      <Footer.Container variant="grid" columns="four">
        <Footer.Section title="Company">
          <Footer.CompanyInfo
            description="Leading cryptocurrency exchange platform offering secure trading with competitive rates and 24/7 support."
            address="123 Financial District, Crypto City"
            phone="+1 (555) 123-4567"
            email="support@exchangego.com"
          />
        </Footer.Section>

        <Footer.Section title="Services">
          <Footer.Link href="/exchange">Spot Trading</Footer.Link>
          <Footer.Link href="/futures">Futures Trading</Footer.Link>
          <Footer.Link href="/staking">Staking</Footer.Link>
          <Footer.Link href="/api">API Access</Footer.Link>
        </Footer.Section>

        <Footer.Section title="Resources">
          <Footer.Link href="/help">Help Center</Footer.Link>
          <Footer.Link href="/fees">Fee Schedule</Footer.Link>
          <Footer.Link href="/security">Security</Footer.Link>
          <Footer.Link href="https://blog.exchangego.com" external>
            Blog
          </Footer.Link>
        </Footer.Section>

        <Footer.Section title="Community">
          <div className="space-y-3">
            <Footer.Social links={mockSocialLinks} />
            <div className="text-sm text-muted-foreground">
              <p>Follow us for updates</p>
              <p>24/7 Support available</p>
            </div>
          </div>
        </Footer.Section>
      </Footer.Container>

      <Footer.Legal links={mockLegalLinks} />
    </Footer>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Полный пример с всеми возможностями Footer compound component',
      },
    },
  },
};
