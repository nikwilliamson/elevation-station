import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { NavItem } from './NavItem';

const meta = {
  title: 'Components/NavItem',
  component: NavItem,
} satisfies Meta<typeof NavItem>;
export default meta;
type Story = StoryObj<typeof meta>;

const OPTIONS = [
  { label: 'Token Designer', value: 'tokens' },
  { label: 'Interaction Designer', value: 'interaction' },
];

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('tokens');
    return <NavItem options={OPTIONS} value={value} onChange={setValue} layoutId="nav-sb" />;
  },
};
