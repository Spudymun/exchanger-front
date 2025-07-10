import { colors } from '@repo/design-tokens';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// Color palette display component
interface ColorPaletteProps {
  colors: Record<string, unknown>;
  title: string;
}

const ColorPalette = ({ colors: colorSet, title }: ColorPaletteProps) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(colorSet).map(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return (
            <div key={key} className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 capitalize">
                {key}
              </h4>
              <div className="space-y-1">
                {Object.entries(value as Record<string, string>).map(([shade, color]) => (
                  <div key={shade} className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1">
                      <div className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        {key}-{shade}
                      </div>
                      <div className="text-xs font-mono text-gray-500 dark:text-gray-500">
                        {color}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div key={key} className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm"
              style={{ backgroundColor: value as string }}
            />
            <div className="flex-1">
              <div className="text-xs font-mono text-gray-600 dark:text-gray-400">{key}</div>
              <div className="text-xs font-mono text-gray-500 dark:text-gray-500">
                {value as string}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// Story component
const ColorsShowcase = () => {
  // Use type assertion to access properties that exist in runtime but not in types
  const colorsAny = colors as unknown as Record<string, unknown>;

  const brandColors = {
    primary: colorsAny.primary,
    secondary: colorsAny.secondary,
  };

  const semanticColors = {
    success: colorsAny.success,
    warning: colorsAny.warning,
    error: colorsAny.error,
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
          ExchangeGO Design System - Colors
        </h1>

        <ColorPalette colors={brandColors} title="Brand Colors" />
        <ColorPalette colors={semanticColors} title="Semantic Colors" />
      </div>
    </div>
  );
};

const meta: Meta<typeof ColorsShowcase> = {
  title: 'Design Tokens/Colors',
  component: ColorsShowcase,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Complete color palette of the ExchangeGO design system including brand and semantic colors.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllColors: Story = {};

export const BrandColors: Story = {
  render: () => {
    const colorsAny = colors as unknown as Record<string, unknown>;
    return (
      <div className="p-6 bg-white dark:bg-gray-900">
        <ColorPalette
          colors={{ primary: colorsAny.primary, secondary: colorsAny.secondary }}
          title="Brand Colors"
        />
      </div>
    );
  },
};

export const SemanticColors: Story = {
  render: () => {
    const colorsAny = colors as unknown as Record<string, unknown>;
    return (
      <div className="p-6 bg-white dark:bg-gray-900">
        <ColorPalette
          colors={{
            success: colorsAny.success,
            warning: colorsAny.warning,
            error: colorsAny.error,
          }}
          title="Semantic Colors"
        />
      </div>
    );
  },
};
