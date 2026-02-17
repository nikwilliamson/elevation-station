import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { LightPositionPad } from './LightPositionPad';

const meta = {
  title: 'Components/LightPositionPad',
  component: LightPositionPad,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof LightPositionPad>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { lightX: 0.24, lightY: 0.64, onChangeX: fn(), onChangeY: fn() },
  render: () => {
    const [x, setX] = useState(0.24);
    const [y, setY] = useState(0.64);
    return <LightPositionPad lightX={x} lightY={y} onChangeX={setX} onChangeY={setY} />;
  },
};

export const Centered: Story = {
  args: { lightX: 0, lightY: 0, onChangeX: fn(), onChangeY: fn() },
  render: () => {
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);
    return <LightPositionPad lightX={x} lightY={y} onChangeX={setX} onChangeY={setY} />;
  },
};
