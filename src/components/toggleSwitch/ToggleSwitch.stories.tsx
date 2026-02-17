import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { ToggleSwitch } from './ToggleSwitch';

const meta = {
  title: 'Components/ToggleSwitch',
  component: ToggleSwitch,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ToggleSwitch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { checked: false, onChange: fn(), label: 'Toggle feature' },
  render: () => {
    const [checked, setChecked] = useState(false);
    return <ToggleSwitch checked={checked} onChange={setChecked} label="Toggle feature" />;
  },
};

export const Checked: Story = {
  args: { checked: true, onChange: fn(), label: 'Enabled' },
  render: () => {
    const [checked, setChecked] = useState(true);
    return <ToggleSwitch checked={checked} onChange={setChecked} label="Enabled" />;
  },
};

export const Small: Story = {
  args: { checked: false, onChange: fn(), label: 'Small toggle', size: 'sm' },
  render: () => {
    const [checked, setChecked] = useState(false);
    return <ToggleSwitch checked={checked} onChange={setChecked} label="Small toggle" size="sm" />;
  },
};
