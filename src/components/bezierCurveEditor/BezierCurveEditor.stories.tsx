import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { BezierCurveEditor } from './BezierCurveEditor';
import type { CurvePoint } from '../../shared/curvePresets';

const meta = {
  title: 'Components/BezierCurveEditor',
  component: BezierCurveEditor,
} satisfies Meta<typeof BezierCurveEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [points, setPoints] = useState<CurvePoint[]>([]);
    return <BezierCurveEditor points={points} onChange={setPoints} />;
  },
};

export const WithPoints: Story = {
  render: () => {
    const [points, setPoints] = useState<CurvePoint[]>([
      { x: 0.2, y: 0.5 },
      { x: 0.4, y: 0.9 },
    ]);
    return <BezierCurveEditor points={points} onChange={setPoints} />;
  },
};

export const WithMarkers: Story = {
  render: () => {
    const [points, setPoints] = useState<CurvePoint[]>([
      { x: 0.3, y: 0.7 },
      { x: 0.6, y: 0.9 },
    ]);
    return (
      <BezierCurveEditor
        points={points}
        onChange={setPoints}
        xMarkers={[0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75]}
        axisLabels={{ x: ['Near', 'Far'], y: ['Low', 'High'] }}
        label="Offset Growth"
        color="#9636df"
      />
    );
  },
};
