import type { Meta, StoryObj } from '@storybook/react-vite';
import { OutputSection } from './OutputSection';

const meta = {
  title: 'Components/OutputSection',
  component: OutputSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof OutputSection>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    cssOutput: `.surface {\n  box-shadow:\n    0px 1px 2px oklch(0.15 0.03 280 / 0.12),\n    0px 3px 6px oklch(0.15 0.03 280 / 0.08);\n}`,
    jsonOutput: `{\n  "surface": {\n    "boxShadow": "0px 1px 2px oklch(0.15 0.03 280 / 0.12)"\n  }\n}`,
  },
};
