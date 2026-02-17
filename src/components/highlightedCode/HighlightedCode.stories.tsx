import type { Meta, StoryObj } from '@storybook/react-vite';
import { HighlightedCode } from './HighlightedCode';

const meta = {
  title: 'Components/HighlightedCode',
  component: HighlightedCode,
} satisfies Meta<typeof HighlightedCode>;
export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_CSS = `.elevated {
  box-shadow:
    0px 1px 2px oklch(0.15 0.03 280 / 0.12),
    0px 3px 6px oklch(0.15 0.03 280 / 0.08),
    0px 6px 12px oklch(0.15 0.03 280 / 0.05);
}`;

const SAMPLE_JSON = `{
  "elevated": {
    "boxShadow": "0px 1px 2px oklch(0.15 0.03 280 / 0.12), 0px 3px 6px oklch(0.15 0.03 280 / 0.08)"
  }
}`;

export const CSS: Story = {
  args: { code: SAMPLE_CSS, lang: 'css' },
};

export const JSON: Story = {
  args: { code: SAMPLE_JSON, lang: 'json' },
};
