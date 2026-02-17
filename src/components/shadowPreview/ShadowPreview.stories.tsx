import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShadowPreview } from './ShadowPreview';

const meta = {
  title: 'Components/ShadowPreview',
  component: ShadowPreview,
} satisfies Meta<typeof ShadowPreview>;
export default meta;
type Story = StoryObj<typeof meta>;

const SHADOW = '0px 2px 4px rgba(23,10,50,0.12), 0px 6px 12px rgba(23,10,50,0.08), 0px 12px 24px rgba(23,10,50,0.05)';

export const Card: Story = {
  args: {
    bgHex: '#f1f1f1',
    surfaceHex: '#ffffff',
    shadowStack: SHADOW,
  },
};

export const ButtonVariant: Story = {
  args: {
    bgHex: '#f1f1f1',
    surfaceHex: '#ffffff',
    shadowStack: SHADOW,
    variant: 'button',
    buttonLabel: 'Click me',
    componentBgHex: '#4158d0',
    componentTextHex: '#ffffff',
  },
};

export const Interactive: Story = {
  args: {
    bgHex: '#f1f1f1',
    surfaceHex: '#ffffff',
    shadowStack: SHADOW,
    variant: 'button',
    buttonLabel: 'Hover me',
    componentBgHex: { default: '#4158d0', hover: '#2c3ab4', active: '#2c3ab4' },
    componentTextHex: { default: '#ffffff', hover: '#ffffff', active: '#ffffff' },
    interactiveShadowStacks: {
      default: SHADOW,
      hover: '0px 4px 8px rgba(23,10,50,0.16), 0px 12px 24px rgba(23,10,50,0.12)',
      active: '0px 1px 2px rgba(23,10,50,0.20)',
    },
    enabledStates: { default: true, hover: true, active: true },
  },
};
