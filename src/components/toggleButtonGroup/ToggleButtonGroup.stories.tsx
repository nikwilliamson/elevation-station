import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ToggleButtonGroup } from './ToggleButtonGroup';

const meta = {
  title: 'Components/ToggleButtonGroup',
  component: ToggleButtonGroup,
} satisfies Meta<typeof ToggleButtonGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

const OPTIONS = [
  { label: 'Low', value: 3 },
  { label: 'Medium', value: 5 },
  { label: 'High', value: 7 },
];

export const Separated: Story = {
  render: () => {
    const [value, setValue] = useState(5);
    return <ToggleButtonGroup options={OPTIONS} value={value} onChange={setValue} />;
  },
};

export const Segmented: Story = {
  render: () => {
    const [value, setValue] = useState(5);
    return <ToggleButtonGroup options={OPTIONS} value={value} onChange={setValue} variant="segmented" />;
  },
};
