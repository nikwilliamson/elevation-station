import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShadowTokenDesigner } from './ShadowTokenDesigner';

const meta = {
  title: 'Page/ShadowTokenDesigner',
  component: ShadowTokenDesigner,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ShadowTokenDesigner>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
