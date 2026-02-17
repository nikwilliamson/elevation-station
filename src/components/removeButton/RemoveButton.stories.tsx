import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { RemoveButton } from './RemoveButton';

const meta = {
  title: 'Components/RemoveButton',
  component: RemoveButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: { onClick: fn() },
} satisfies Meta<typeof RemoveButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomLabel: Story = {
  args: { label: 'Delete elevation' },
};
