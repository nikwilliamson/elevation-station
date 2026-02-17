import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShadowInteractionDesigner } from './ShadowInteractionDesigner';

const meta = {
  title: 'Page/ShadowInteractionDesigner',
  component: ShadowInteractionDesigner,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ShadowInteractionDesigner>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
