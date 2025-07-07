import type { Meta, StoryObj } from '@storybook/react';

import { Folder, File, Settings, Users, Database } from 'lucide-react';

import { TreeView, type TreeNode } from '../components/tree-view';

const sampleData: TreeNode[] = [
  {
    id: '1',
    label: 'Project Root',
    icon: <Folder className="h-3 w-3" />,
    children: [
      {
        id: '2',
        label: 'src',
        icon: <Folder className="h-3 w-3" />,
        children: [
          {
            id: '3',
            label: 'components',
            icon: <Folder className="h-3 w-3" />,
            children: [
              {
                id: '4',
                label: 'Button.tsx',
                icon: <File className="h-3 w-3" />,
              },
              {
                id: '5',
                label: 'Card.tsx',
                icon: <File className="h-3 w-3" />,
              },
            ],
          },
          {
            id: '6',
            label: 'pages',
            icon: <Folder className="h-3 w-3" />,
            children: [
              {
                id: '7',
                label: 'index.tsx',
                icon: <File className="h-3 w-3" />,
              },
              {
                id: '8',
                label: 'about.tsx',
                icon: <File className="h-3 w-3" />,
              },
            ],
          },
        ],
      },
      {
        id: '9',
        label: 'public',
        icon: <Folder className="h-3 w-3" />,
        children: [
          {
            id: '10',
            label: 'images',
            icon: <Folder className="h-3 w-3" />,
            children: [
              {
                id: '11',
                label: 'logo.png',
                icon: <File className="h-3 w-3" />,
              },
            ],
          },
        ],
      },
      {
        id: '12',
        label: 'package.json',
        icon: <Settings className="h-3 w-3" />,
      },
    ],
  },
  {
    id: '13',
    label: 'Configuration',
    icon: <Settings className="h-3 w-3" />,
    children: [
      {
        id: '14',
        label: 'Database',
        icon: <Database className="h-3 w-3" />,
        children: [
          {
            id: '15',
            label: 'Users',
            icon: <Users className="h-3 w-3" />,
          },
          {
            id: '16',
            label: 'Settings',
            icon: <Settings className="h-3 w-3" />,
            disabled: true,
          },
        ],
      },
    ],
  },
];

const meta: Meta<typeof TreeView> = {
  title: 'Components/TreeView',
  component: TreeView,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: sampleData,
    onSelect: (node: TreeNode) => {
      console.log('Selected:', node);
    },
  },
};

export const WithoutIcons: Story = {
  args: {
    data: sampleData,
    onSelect: (node: TreeNode) => {
      console.log('Selected:', node);
    },
  },
};

export const ExpandedByDefault: Story = {
  args: {
    data: sampleData,
    defaultExpanded: ['1', '2', '3'],
    onSelect: (node: TreeNode) => {
      console.log('Selected:', node);
    },
  },
};

export const WithSelection: Story = {
  args: {
    data: sampleData,
    selectedId: '4',
    defaultExpanded: ['1', '2', '3'],
    onSelect: (node: TreeNode) => {
      console.log('Selected:', node);
    },
  },
};
