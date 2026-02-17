import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { ToggleButtonGroup } from './ToggleButtonGroup';

const meta = {
  title: 'Components/ToggleButtonGroup',
  component: ToggleButtonGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ToggleButtonGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

const OPTIONS = [
  { label: 'Low', value: 3 },
  { label: 'Medium', value: 5 },
  { label: 'High', value: 7 },
];

export const Separated: Story = {
  args: { options: OPTIONS, value: 5, onChange: fn() },
  render: () => {
    const [value, setValue] = useState(5);
    return <ToggleButtonGroup options={OPTIONS} value={value} onChange={setValue} />;
  },
};

export const Segmented: Story = {
  args: { options: OPTIONS, value: 5, onChange: fn(), variant: 'segmented' },
  render: () => {
    const [value, setValue] = useState(5);
    return <ToggleButtonGroup options={OPTIONS} value={value} onChange={setValue} variant="segmented" />;
  },
};
