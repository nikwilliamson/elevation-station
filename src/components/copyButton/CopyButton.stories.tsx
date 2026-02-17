import type { Meta, StoryObj } from '@storybook/react-vite';
import { CopyButton } from './CopyButton';

const meta = {
  title: 'Components/CopyButton',
  component: CopyButton,
} satisfies Meta<typeof CopyButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { text: 'Copied text value' },
};

export const CustomLabels: Story = {
  args: {
    text: 'box-shadow: 0 2px 4px rgba(0,0,0,0.1);',
    labels: { idle: 'Copy CSS', success: 'Copied!' },
  },
};

export const LowEmphasis: Story = {
  args: { text: 'hello', emphasis: 'low', size: 'md' },
};
