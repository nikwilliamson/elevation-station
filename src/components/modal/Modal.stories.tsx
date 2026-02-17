import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../button/Button';

const meta = {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Modal>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { open: false, onClose: fn(), title: 'Edit Elevation', children: 'Modal content goes here.' },
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal open={open} onClose={() => setOpen(false)} title="Edit Elevation">
          <p style={{ color: 'var(--es-color-text-primary)' }}>Modal content goes here.</p>
        </Modal>
      </>
    );
  },
};

export const OpenByDefault: Story = {
  args: { open: true, onClose: fn(), title: 'Shadow Settings', children: 'This modal opens immediately.' },
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <Modal open={open} onClose={() => setOpen(false)} title="Shadow Settings">
        <p style={{ color: 'var(--es-color-text-primary)' }}>This modal opens immediately.</p>
      </Modal>
    );
  },
};
