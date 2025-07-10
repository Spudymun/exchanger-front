import { spacing } from '@repo/design-tokens';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// Spacing scale section
const SpacingScaleSection = ({ spacingValues }: { spacingValues: Record<string, string> }) => (
  <section className="mb-12">
    <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Spacing Scale</h2>

    <div className="space-y-6">
      {Object.entries(spacingValues).map(([key, value]) => (
        <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-mono text-gray-500 dark:text-gray-400 w-8">{key}</span>
              <span className="text-sm font-mono text-gray-600 dark:text-gray-300">{value}</span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">space-{key}</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div
                className="bg-blue-500 rounded"
                style={{
                  width: value,
                  height: '24px',
                  minWidth: '4px',
                }}
              />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Visual representation of {key} spacing
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

// Usage examples section
const UsageExamplesSection = () => (
  <section>
    <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Usage Examples</h2>

    <div className="space-y-8">
      {/* Padding Examples */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
          Padding Examples
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded p-2">
              <div className="bg-blue-500 text-white text-sm rounded px-3 py-1">p-2 (8px)</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded p-4">
              <div className="bg-blue-500 text-white text-sm rounded px-3 py-1">p-4 (16px)</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded p-6">
              <div className="bg-blue-500 text-white text-sm rounded px-3 py-1">p-6 (24px)</div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded p-8">
              <div className="bg-blue-500 text-white text-sm rounded px-3 py-1">p-8 (32px)</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded p-12">
              <div className="bg-blue-500 text-white text-sm rounded px-3 py-1">p-12 (48px)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Component Spacing */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
          Component Spacing
        </h3>
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="text-base font-medium mb-2 text-gray-900 dark:text-gray-100">
              Card with standard spacing
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This card uses our design system spacing values for consistent layout.
            </p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded text-sm">
              Action Button
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Main spacing showcase component
const SpacingShowcase = () => {
  const spacingAny = spacing as unknown as Record<string, unknown>;
  const spacingValues = (spacingAny.spacing as Record<string, string>) || {};

  return (
    <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
          ExchangeGO Design System - Spacing
        </h1>

        <SpacingScaleSection spacingValues={spacingValues} />
        <UsageExamplesSection />
      </div>
    </div>
  );
};

const meta: Meta<typeof SpacingShowcase> = {
  title: 'Design Tokens/Spacing',
  component: SpacingShowcase,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Complete spacing system of the ExchangeGO design system including spacing scale and usage examples.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllSpacing: Story = {};

export const SpacingScale: Story = {
  render: () => {
    const spacingAny = spacing as unknown as Record<string, unknown>;
    const spacingValues = (spacingAny.spacing as Record<string, string>) || {};

    return (
      <div className="p-6 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <SpacingScaleSection spacingValues={spacingValues} />
        </div>
      </div>
    );
  },
};
