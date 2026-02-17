import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { TextInput } from './TextInput';

const meta = {
  title: 'Components/TextInput',
  component: TextInput,
  args: { onChange: fn() },
} satisfies Meta<typeof TextInput>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Name', defaultValue: 'elevated' },
};

export const Small: Story = {
  args: { label: 'Value', size: 'sm', defaultValue: '0.5' },
};

export const ExtraSmall: Story = {
  args: { label: 'X', size: 'xs', defaultValue: '0.24' },
};

export const Mono: Story = {
  args: { label: 'Color', mono: true, defaultValue: '#170a32' },
};

export const HiddenLabel: Story = {
  args: { label: 'Hidden', hideLabel: true, defaultValue: 'value', placeholder: 'Enter value...' },
};

export const LowEmphasis: Story = {
  args: { label: 'Subtle', emphasis: 'low', defaultValue: 'text' },
};
