import type { Meta, StoryObj } from '@storybook/react-vite';
import { ControlCard } from './ControlCard';

const meta = {
  title: 'Components/ControlCard',
  component: ControlCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ControlCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Shadow Engine',
    children: 'Slot content goes here',
  },
};

export const WithDescription: Story = {
  args: {
    title: 'Light Position',
    description: 'Where the light source is relative to the surface',
    children: 'Slot content goes here',
  },
};

export const Small: Story = {
  args: {
    title: 'Elevation Token',
    size: 'sm',
    children: 'Slot content goes here',
  },
};

export const Large: Story = {
  args: {
    title: 'Shadow Engine',
    description: 'Core parameters that shape the shadow output',
    size: 'lg',
    children: 'Slot content goes here',
  },
};
