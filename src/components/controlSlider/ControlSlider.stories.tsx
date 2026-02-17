import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { ControlSlider } from './ControlSlider';

const meta = {
  title: 'Components/ControlSlider',
  component: ControlSlider,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ControlSlider>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Intensity',
    value: 0.64,
    min: 0,
    max: 1,
    step: 0.01,
    onChange: fn(),
  },
  render: () => {
    const [value, setValue] = useState(0.64);
    return (
      <ControlSlider
        label="Intensity"
        value={value}
        min={0}
        max={1}
        step={0.01}
        onChange={setValue}
      />
    );
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Depth',
    description: 'How far the element appears raised',
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    onChange: fn(),
  },
  render: () => {
    const [value, setValue] = useState(0.5);
    return (
      <ControlSlider
        label="Depth"
        description="How far the element appears raised"
        value={value}
        min={0}
        max={1}
        step={0.01}
        onChange={setValue}
      />
    );
  },
};
