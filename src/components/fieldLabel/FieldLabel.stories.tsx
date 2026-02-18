import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { FieldLabel } from './FieldLabel';

const meta = {
  title: 'Components/FieldLabel',
  component: FieldLabel,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof FieldLabel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Field Label' },
};

export const WithDescription: Story = {
  args: { label: 'Intensity', description: 'Controls shadow strength' },
};

export const WithToggle: Story = {
  args: { label: 'Accent Color', toggle: 'on', onToggleChange: fn() },
};

export const ToggleOff: Story = {
  args: { label: 'Accent Color', toggle: 'off', onToggleChange: fn() },
};

export const Small: Story = {
  args: { label: 'Small Label', size: 'sm' },
};

export const Medium: Story = {
  args: { label: 'Medium Label', size: 'md' },
};

export const Large: Story = {
  args: { label: 'Large Label', size: 'lg' },
};
