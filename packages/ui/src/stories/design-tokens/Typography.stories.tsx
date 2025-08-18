import { typography } from '@repo/design-tokens';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// Font family section component
const FontFamiliesSection = ({ fontFamily }: { fontFamily: Record<string, string[]> }) => (
  <section className="mb-12">
    <h2 className="text-2xl font-semibold mb-6 text-foreground">Font Families</h2>

    <div className="space-y-6">
      {Object.entries(fontFamily).map(([name, fonts]) => (
        <div key={name} className="border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-foreground capitalize">{name}</h3>
            <span className="text-sm text-muted-foreground font-mono">font-{name}</span>
          </div>

          <div className="text-2xl mb-4 text-foreground" style={{ fontFamily: fonts.join(', ') }}>
            The quick brown fox jumps over the lazy dog
          </div>

          <div
            className="text-base text-muted-foreground mb-4"
            style={{ fontFamily: fonts.join(', ') }}
          >
            Bitcoin (BTC): $43,250.50 | Ethereum (ETH): $2,845.75 | 1234567890
          </div>

          <div className="text-xs text-muted-foreground font-mono">{fonts.join(', ')}</div>
        </div>
      ))}
    </div>
  </section>
);

// Font sizes section component
const FontSizesSection = ({ fontSize }: { fontSize: Record<string, unknown> }) => (
  <section className="mb-12">
    <h2 className="text-2xl font-semibold mb-6 text-foreground">Font Sizes</h2>

    <div className="space-y-4">
      {Object.entries(fontSize).map(([size, value]) => (
        <div key={size} className="flex items-center space-x-6 py-3">
          <div className="w-16 text-sm text-muted-foreground font-mono">{size}</div>
          <div className="flex-1">
            <div
              className="text-foreground"
              style={{ fontSize: typeof value === 'string' ? value : '16px' }}
            >
              Sample text in {size} size
            </div>
          </div>
          <div className="text-sm text-muted-foreground font-mono w-20">
            {typeof value === 'string' ? value : JSON.stringify(value)}
          </div>
        </div>
      ))}
    </div>
  </section>
);

// Usage examples section component
const UsageExamplesSection = () => (
  <section>
    <h2 className="text-2xl font-semibold mb-6 text-foreground">Usage Examples</h2>

    <div className="space-y-8">
      {/* Headings */}
      <div className="border border-border rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4 text-foreground">Headings</h3>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Heading 1 - Main Page Title</h1>
          <h2 className="text-3xl font-semibold text-foreground">Heading 2 - Section Title</h2>
          <h3 className="text-2xl font-medium text-foreground">Heading 3 - Subsection Title</h3>
          <h4 className="text-xl font-medium text-foreground">Heading 4 - Component Title</h4>
        </div>
      </div>

      {/* Body Text */}
      <div className="border border-border rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4 text-foreground">Body Text</h3>
        <div className="space-y-4">
          <p className="text-base text-foreground">
            Regular body text for general content and descriptions.
          </p>
          <p className="text-sm text-muted-foreground">
            Small text for secondary information and metadata.
          </p>
          <p className="text-xs text-muted-foreground">
            Extra small text for disclaimers and fine print.
          </p>
        </div>
      </div>

      {/* Crypto Specific */}
      <div className="border border-border rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4 text-foreground">Crypto & Financial Data</h3>
        <div className="space-y-4">
          <div className="font-mono text-2xl font-bold text-success">$43,250.50 USD</div>
          <div className="font-mono text-lg text-foreground">1BTC = 43,250.50 USD</div>
          <div className="font-mono text-sm text-muted-foreground">
            bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Main typography showcase component
const TypographyShowcase = () => {
  const typographyAny = typography as unknown as Record<string, unknown>;
  const fontFamily = (typographyAny.fontFamily as Record<string, string[]>) || {};
  const fontSize = (typographyAny.fontSize as Record<string, unknown>) || {};

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-foreground">
          ExchangeGO Design System - Typography
        </h1>

        <FontFamiliesSection fontFamily={fontFamily} />
        <FontSizesSection fontSize={fontSize} />
        <UsageExamplesSection />
      </div>
    </div>
  );
};

const meta: Meta<typeof TypographyShowcase> = {
  title: 'Design Tokens/Typography',
  component: TypographyShowcase,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Complete typography system of the ExchangeGO design system including font families, sizes, and usage examples.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllTypography: Story = {};

export const FontFamilies: Story = {
  render: () => {
    const typographyAny = typography as unknown as Record<string, unknown>;
    const fontFamily = (typographyAny.fontFamily as Record<string, string[]>) || {};

    return (
      <div className="p-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <FontFamiliesSection fontFamily={fontFamily} />
        </div>
      </div>
    );
  },
};
