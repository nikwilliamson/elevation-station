import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { StatePanel } from './StatePanel';

const meta = {
  title: 'Composed/StatePanel',
  component: StatePanel,
} satisfies Meta<typeof StatePanel>;
export default meta;
type Story = StoryObj<typeof meta>;

const SHADOW_STACK = '0px 2px 4px rgba(23,10,50,0.12), 0px 6px 12px rgba(23,10,50,0.08)';

export const DefaultState: Story = {
  args: {
    name: 'default',
    config: {
      depth: 0.15,
      intensity: 0.30,
      hardness: 0.30,
      shadowColorHex: '#170a32',
      accentColorHex: '#101756',
      componentBgHex: '#4158d0',
      componentTextHex: '#ffffff',
    },
    isActive: true,
    shadowStack: SHADOW_STACK,
    shadowColorHsl: 'hsl(260, 60%, 12%)',
    accentColorHsl: 'hsl(234, 70%, 20%)',
    preview: { bgHex: '#f1f1f1', componentBgHex: '#4158d0', componentTextHex: '#ffffff' },
    onSliderChange: fn(),
    onShadowColorChange: fn(),
    onAccentColorChange: fn(),
  },
};

export const HoverState: Story = {
  args: {
    ...DefaultState.args,
    name: 'hover',
    config: {
      depth: 0.45,
      intensity: 0.40,
      hardness: 0.25,
      shadowColorHex: '#170a32',
      accentColorHex: '#101756',
      componentBgHex: '#2c3ab4',
      componentTextHex: '#ffffff',
    },
  },
};

export const Grouped: Story = {
  args: {
    ...DefaultState.args,
    grouped: true,
  },
};

export const WithEnabledToggle: Story = {
  args: {
    ...DefaultState.args,
    name: 'hover',
    enabled: true,
    onEnabledChange: fn(),
  },
};
