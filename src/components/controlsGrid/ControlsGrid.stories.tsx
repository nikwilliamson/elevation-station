import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ControlsGrid } from './ControlsGrid';
import { DEFAULTS } from '../../shared/defaults';
import type { EngineParams, ShadowCurves } from '../../shared/defaults';
import type { ColorFormat } from '../../shared/colorPalette';
import type { CurvePoint } from '../../shared/curvePresets';

const meta = {
  title: 'Composed/ControlsGrid',
  component: ControlsGrid,
} satisfies Meta<typeof ControlsGrid>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [engine, setEngine] = useState<EngineParams>(DEFAULTS.engine);
    const [curves, setCurves] = useState<ShadowCurves>(DEFAULTS.curves);
    const [format, setFormat] = useState<ColorFormat>('oklch');
    const [shadow, setShadow] = useState(DEFAULTS.shadowColorHex);
    const [accent, setAccent] = useState<string | null>(DEFAULTS.accentColorHex);
    return (
      <ControlsGrid
        engine={engine}
        onEngineChange={(key, value) => setEngine((prev) => ({ ...prev, [key]: value }))}
        curves={curves}
        onCurveChange={(key: keyof ShadowCurves, points: CurvePoint[]) =>
          setCurves((prev) => ({ ...prev, [key]: points }))
        }
        colorFormat={format}
        onColorFormatChange={setFormat}
        shadowColorHex={shadow}
        accentColorHex={accent}
        onColorChange={setShadow}
        onAccentColorChange={setAccent}
        elevationDepths={[0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75]}
      />
    );
  },
};
