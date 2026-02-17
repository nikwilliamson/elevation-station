import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { ColorControls } from './ColorControls';
import type { ColorFormat } from '../../shared/colorPalette';

const meta = {
  title: 'Composed/ColorControls',
  component: ColorControls,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ColorControls>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    colorFormat: 'oklch',
    onColorFormatChange: fn(),
    shadowColorHex: '#170a32',
    accentColorHex: '#101756',
    onColorChange: fn(),
    onAccentColorChange: fn(),
  },
  render: () => {
    const [format, setFormat] = useState<ColorFormat>('oklch');
    const [shadow, setShadow] = useState('#170a32');
    const [accent, setAccent] = useState<string | null>('#101756');
    return (
      <ColorControls
        colorFormat={format}
        onColorFormatChange={setFormat}
        shadowColorHex={shadow}
        accentColorHex={accent}
        onColorChange={setShadow}
        onAccentColorChange={setAccent}
      />
    );
  },
};
