import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { StateGroup } from './StateGroup';

const meta = {
  title: 'Composed/StateGroup',
  component: StateGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{
        '--state-panel-gap': 'var(--gap-normal)',
        '--state-panel-padding': 'var(--inset-spacious)',
        '--state-panel-card-radius': 'var(--radius-md)',
        '--state-panel-card-bg': 'var(--interactive-default)',
        '--state-panel-card-border': 'var(--border-subtle-shorthand)',
        width: 480,
      } as React.CSSProperties}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StateGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

const BASE_CONFIG = {
  shadowColorHex: '#170a32',
  accentColorHex: '#101756',
  componentBgHex: '#4158d0',
  componentTextHex: '#ffffff',
};

const SHADOW_STACK = '0px 2px 4px rgba(23,10,50,0.12), 0px 6px 12px rgba(23,10,50,0.08)';

export const Default: Story = {
  args: {
    editingIndex: 0,
    interactionStates: {
      default: { depth: 0.12, intensity: 0.24, hardness: 0.32, ...BASE_CONFIG },
      hover: { depth: 0.48, intensity: 0.48, hardness: 0.24, ...BASE_CONFIG, componentBgHex: '#2c3ab4' },
      active: { depth: 0.24, intensity: 0.24, hardness: 0.40, ...BASE_CONFIG, componentBgHex: '#2c3ab4' },
    },
    enabledStates: { default: true, hover: true, active: true },
    interactiveShadowStacks: {
      default: SHADOW_STACK,
      hover: SHADOW_STACK,
      active: SHADOW_STACK,
    },
    preview: { bgHex: '#f1f1f1', surfaceHex: '#ffffff' },
    onInteractionStateChange: fn(),
    onInteractionStateEnabledChange: fn(),
  },
};

export const WithDisabledState: Story = {
  args: {
    ...Default.args,
    enabledStates: { default: true, hover: false, active: true },
  },
};
