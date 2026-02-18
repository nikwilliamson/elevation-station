import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { StatePanel } from './StatePanel';

const meta = {
  title: 'Composed/StatePanel',
  component: StatePanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StatePanel>;
export default meta;
type Story = StoryObj<typeof meta>;

const SHADOW_STACK = '0px 2px 4px rgba(23,10,50,0.12), 0px 6px 12px rgba(23,10,50,0.08)';

export const DefaultState: Story = {
  args: {
    name: 'default',
    shadowStack: SHADOW_STACK,
    preview: { bgHex: '#f1f1f1', surfaceHex: '#ffffff', componentBgHex: '#4158d0', componentTextHex: '#ffffff' },
    children: 'Slot content goes here',
  },
};

export const HoverState: Story = {
  args: {
    ...DefaultState.args,
    name: 'hover',
    preview: { bgHex: '#f1f1f1', surfaceHex: '#ffffff', componentBgHex: '#2c3ab4', componentTextHex: '#ffffff' },
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

export const Disabled: Story = {
  args: {
    ...DefaultState.args,
    name: 'hover',
    enabled: false,
    onEnabledChange: fn(),
  },
};
