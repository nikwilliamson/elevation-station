import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { NavItem } from './NavItem';

const meta = {
  title: 'Components/NavItem',
  component: NavItem,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof NavItem>;
export default meta;
type Story = StoryObj<typeof meta>;

const OPTIONS = [
  { label: 'Token Designer', value: 'tokens' },
  { label: 'Interaction Designer', value: 'interaction' },
];

export const Default: Story = {
  args: { options: OPTIONS, value: 'tokens', onChange: fn(), layoutId: 'nav-sb' },
  render: () => {
    const [value, setValue] = useState('tokens');
    return <NavItem options={OPTIONS} value={value} onChange={setValue} layoutId="nav-sb" />;
  },
};
