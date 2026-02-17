import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { TabSelect } from './TabSelect';

const meta = {
  title: 'Components/TabSelect',
  component: TabSelect,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof TabSelect>;
export default meta;
type Story = StoryObj<typeof meta>;

const TABS = [
  { label: 'Preview', value: 'preview' },
  { label: 'CSS', value: 'css' },
  { label: 'JSON', value: 'json' },
];

export const Pill: Story = {
  args: { options: TABS, value: 'preview', onChange: fn(), layoutId: 'tab-sb-pill' },
  render: () => {
    const [value, setValue] = useState('preview');
    return <TabSelect options={TABS} value={value} onChange={setValue} layoutId="tab-sb-pill" />;
  },
};

export const Border: Story = {
  args: { options: TABS, value: 'preview', onChange: fn(), variant: 'border', layoutId: 'tab-sb-border' },
  render: () => {
    const [value, setValue] = useState('preview');
    return <TabSelect options={TABS} value={value} onChange={setValue} variant="border" layoutId="tab-sb-border" />;
  },
};

export const Small: Story = {
  args: { options: TABS, value: 'preview', onChange: fn(), size: 'sm', layoutId: 'tab-sb-sm' },
  render: () => {
    const [value, setValue] = useState('preview');
    return <TabSelect options={TABS} value={value} onChange={setValue} size="sm" layoutId="tab-sb-sm" />;
  },
};

export const NotContained: Story = {
  args: { options: TABS, value: 'preview', onChange: fn(), contained: false, layoutId: 'tab-sb-nc' },
  render: () => {
    const [value, setValue] = useState('preview');
    return <TabSelect options={TABS} value={value} onChange={setValue} contained={false} layoutId="tab-sb-nc" />;
  },
};
