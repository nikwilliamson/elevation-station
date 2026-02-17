import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { ColorPicker } from './ColorPicker';

const meta = {
  title: 'Components/ColorPicker',
  component: ColorPicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ColorPicker>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: '#170a32',
    onChange: () => {},
    label: 'Shadow Color',
  },
  render: () => {
    const [value, setValue] = useState('#170a32');
    return <ColorPicker value={value} onChange={setValue} label="Shadow Color" />;
  },
};

export const WithToggle: Story = {
  args: {
    value: '#101756',
    onChange: () => {},
    label: 'Accent Color',
    toggle: 'on',
    onToggleChange: () => {},
  },
  render: () => {
    const [value, setValue] = useState('#101756');
    return (
      <ColorPicker
        value={value}
        onChange={setValue}
        label="Accent Color"
        toggle="on"
        onToggleChange={fn()}
      />
    );
  },
};

export const Disabled: Story = {
  args: { value: '#cccccc', onChange: fn(), label: 'Disabled', disabled: true },
};
