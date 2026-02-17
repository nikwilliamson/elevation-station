import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ControlSlider } from './ControlSlider';

const meta = {
  title: 'Components/ControlSlider',
  component: ControlSlider,
} satisfies Meta<typeof ControlSlider>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
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
