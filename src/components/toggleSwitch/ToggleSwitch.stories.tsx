import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ToggleSwitch } from './ToggleSwitch';

const meta = {
  title: 'Components/ToggleSwitch',
  component: ToggleSwitch,
} satisfies Meta<typeof ToggleSwitch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return <ToggleSwitch checked={checked} onChange={setChecked} label="Toggle feature" />;
  },
};

export const Checked: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    return <ToggleSwitch checked={checked} onChange={setChecked} label="Enabled" />;
  },
};

export const Small: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return <ToggleSwitch checked={checked} onChange={setChecked} label="Small toggle" size="sm" />;
  },
};
