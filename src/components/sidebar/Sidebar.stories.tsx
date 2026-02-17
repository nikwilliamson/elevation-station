import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Sidebar, type SidebarTab } from './Sidebar';

const meta = {
  title: 'Components/Sidebar',
  component: Sidebar,
} satisfies Meta<typeof Sidebar>;
export default meta;
type Story = StoryObj<typeof meta>;

const TABS: SidebarTab[] = [
  {
    label: 'Preview',
    value: 'preview',
    title: 'Preview',
    content: React.createElement('div', { style: { padding: 16, color: 'var(--es-color-text-primary)' } }, 'Preview content'),
  },
  {
    label: 'CSS',
    value: 'css',
    title: 'CSS Output',
    content: React.createElement('pre', { style: { padding: 16, color: 'var(--es-color-text-primary)' } }, '.elevated { box-shadow: 0 2px 4px rgba(0,0,0,0.1); }'),
  },
  {
    label: 'JSON',
    value: 'json',
    title: 'JSON Output',
    content: React.createElement('pre', { style: { padding: 16, color: 'var(--es-color-text-primary)' } }, '{ "elevated": { "boxShadow": "..." } }'),
  },
];

export const Default: Story = {
  render: () => {
    const [tab, setTab] = useState('preview');
    return (
      <div style={{ height: 400, display: 'grid', gridTemplateColumns: '1fr' }}>
        <Sidebar tabs={TABS} activeTab={tab} onTabChange={setTab} layoutId="sb-sidebar" />
      </div>
    );
  },
};
