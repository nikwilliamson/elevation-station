import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ElevationCard } from './ElevationCard';

const meta = {
  title: 'Composed/ElevationCard',
  component: ElevationCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ElevationCard>;
export default meta;
type Story = StoryObj<typeof meta>;

const SHADOW = '0px 2px 4px rgba(23,10,50,0.12), 0px 6px 12px rgba(23,10,50,0.08)';

export const GridVariant: Story = {
  args: {
    index: 0,
    name: 'elevated',
    depth: 0.35,
    zIndex: 3,
    type: 'static',
    shadowStack: SHADOW,
    preview: { bgHex: '#f1f1f1', surfaceHex: '#ffffff' },
    variant: 'grid',
    onEdit: fn(),
    onRemove: fn(),
    canRemove: true,
  },
};

export const ListVariant: Story = {
  args: {
    ...GridVariant.args,
    variant: 'list',
  },
};

export const Interactive: Story = {
  args: {
    ...GridVariant.args,
    type: 'interactive',
    componentBgHex: { default: '#4158d0', hover: '#2c3ab4', active: '#2c3ab4' },
    componentTextHex: { default: '#ffffff', hover: '#ffffff', active: '#ffffff' },
    interactiveShadowStacks: {
      default: SHADOW,
      hover: '0px 4px 8px rgba(23,10,50,0.16), 0px 12px 24px rgba(23,10,50,0.12)',
      active: '0px 1px 2px rgba(23,10,50,0.20)',
    },
    enabledStates: { default: true, hover: true, active: true },
  },
};

export const CannotRemove: Story = {
  args: {
    ...GridVariant.args,
    canRemove: false,
  },
};
