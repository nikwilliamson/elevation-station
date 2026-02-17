import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { GlobalControls } from './GlobalControls';

const meta = {
  title: 'Composed/GlobalControls',
  component: GlobalControls,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof GlobalControls>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    state: {
      lightX: 0.35,
      lightY: 1.0,
      layerCount: 5,
      states: {},
      preview: { bgHex: '#f1f1f1', componentBgHex: '#4158d0', componentTextHex: '#ffffff' },
    },
    onLightChange: fn(),
    onLayerCountChange: fn(),
    onPreviewChange: fn(),
  },
};
