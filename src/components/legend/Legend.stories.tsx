import type { Meta, StoryObj } from '@storybook/react-vite';
import { Legend } from './Legend';

const meta = {
  title: 'Components/Legend',
  component: Legend,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Legend>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { label: 'X', value: '0.24' },
      { label: 'Y', value: '0.64' },
    ],
  },
};

export const WithMuted: Story = {
  args: {
    items: [
      { label: 'Layers', value: 7 },
      { label: 'Intensity', value: '64%' },
      { label: 'Disabled', value: '—', muted: true },
    ],
  },
};
