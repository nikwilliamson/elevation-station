import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { LightPositionPad } from './LightPositionPad';

const meta = {
  title: 'Components/LightPositionPad',
  component: LightPositionPad,
} satisfies Meta<typeof LightPositionPad>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [x, setX] = useState(0.24);
    const [y, setY] = useState(0.64);
    return <LightPositionPad lightX={x} lightY={y} onChangeX={setX} onChangeY={setY} />;
  },
};

export const Centered: Story = {
  render: () => {
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);
    return <LightPositionPad lightX={x} lightY={y} onChangeX={setX} onChangeY={setY} />;
  },
};
