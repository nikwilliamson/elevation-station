import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { Button, type ButtonState } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { onClick: fn() },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: 'Button' },
};

export const HighEmphasis: Story = {
  args: { children: 'Primary', emphasis: 'high' },
};

export const MediumEmphasis: Story = {
  args: { children: 'Secondary', emphasis: 'medium' },
};

export const LowEmphasis: Story = {
  args: { children: 'Tertiary', emphasis: 'low' },
};

export const Small: Story = {
  args: { children: 'Small', size: 'sm' },
};

export const ExtraSmall: Story = {
  args: { children: 'XS', size: 'xs' },
};

export const Large: Story = {
  args: { children: 'Large', size: 'lg' },
};

export const Multistate: Story = {
  render: () => {
    const [state, setState] = useState<ButtonState>('idle');
    const cycle = () => {
      setState('processing');
      setTimeout(() => setState('success'), 1500);
      setTimeout(() => setState('idle'), 3000);
    };
    return <Button state={state} onClick={cycle} stateLabels={{ idle: 'Submit' }} />;
  },
};

export const ErrorState: Story = {
  render: () => {
    const [state, setState] = useState<ButtonState>('idle');
    const cycle = () => {
      setState('processing');
      setTimeout(() => setState('error'), 1500);
      setTimeout(() => setState('idle'), 3000);
    };
    return <Button state={state} onClick={cycle} stateLabels={{ idle: 'Submit' }} />;
  },
};
