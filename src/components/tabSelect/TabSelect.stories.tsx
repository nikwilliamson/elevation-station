import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TabSelect } from './TabSelect';

const meta = {
  title: 'Components/TabSelect',
  component: TabSelect,
} satisfies Meta<typeof TabSelect>;
export default meta;
type Story = StoryObj<typeof meta>;

const TABS = [
  { label: 'Preview', value: 'preview' },
  { label: 'CSS', value: 'css' },
  { label: 'JSON', value: 'json' },
];

export const Pill: Story = {
  render: () => {
    const [value, setValue] = useState('preview');
    return <TabSelect options={TABS} value={value} onChange={setValue} layoutId="tab-sb-pill" />;
  },
};

export const Border: Story = {
  render: () => {
    const [value, setValue] = useState('preview');
    return <TabSelect options={TABS} value={value} onChange={setValue} variant="border" layoutId="tab-sb-border" />;
  },
};

export const Small: Story = {
  render: () => {
    const [value, setValue] = useState('preview');
    return <TabSelect options={TABS} value={value} onChange={setValue} size="sm" layoutId="tab-sb-sm" />;
  },
};

export const NotContained: Story = {
  render: () => {
    const [value, setValue] = useState('preview');
    return <TabSelect options={TABS} value={value} onChange={setValue} contained={false} layoutId="tab-sb-nc" />;
  },
};
