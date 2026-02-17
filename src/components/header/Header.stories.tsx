import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Header } from './Header';
import { Button } from '../button/Button';

const meta = {
  title: 'Page/Header',
  component: Header,
} satisfies Meta<typeof Header>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    action: React.createElement(Button, { size: 'sm', emphasis: 'medium' }, 'Export'),
  },
};
