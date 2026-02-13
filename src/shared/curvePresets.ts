export interface CurvePoint {
  x: number;
  y: number;
}

export interface CurvePreset {
  label: string;
  points: CurvePoint[];
}

export const CURVE_PRESETS: CurvePreset[] = [
  { label: 'Linear', points: [] },
  {
    label: 'Ease In',
    points: [
      { x: 0.4, y: 0.1 },
      { x: 0.7, y: 0.3 },
    ],
  },
  {
    label: 'Ease Out',
    points: [
      { x: 0.3, y: 0.7 },
      { x: 0.6, y: 0.9 },
    ],
  },
  {
    label: 'Ease In-Out',
    points: [
      { x: 0.3, y: 0.1 },
      { x: 0.7, y: 0.9 },
    ],
  },
  {
    label: 'Steps',
    points: [
      { x: 0.24, y: 0 },
      { x: 0.25, y: 0.33 },
      { x: 0.49, y: 0.33 },
      { x: 0.5, y: 0.66 },
      { x: 0.74, y: 0.66 },
      { x: 0.75, y: 1 },
    ],
  },
  {
    label: 'Late Bloom',
    points: [
      { x: 0.6, y: 0.1 },
      { x: 0.8, y: 0.5 },
    ],
  },
  {
    label: 'Early Burst',
    points: [
      { x: 0.2, y: 0.5 },
      { x: 0.4, y: 0.9 },
    ],
  },
  {
    label: 'S-Curve',
    points: [
      { x: 0.25, y: 0.05 },
      { x: 0.4, y: 0.3 },
      { x: 0.6, y: 0.7 },
      { x: 0.75, y: 0.95 },
    ],
  },
];

export type CurvePresetName = (typeof CURVE_PRESETS)[number]['label'];

const PRESET_MAP = new Map(CURVE_PRESETS.map((p) => [p.label, p.points]));

/** Resolve a preset name to its points, or return the points as-is. */
export function resolvePreset(value: CurvePresetName | CurvePoint[]): CurvePoint[] {
  if (typeof value === 'string') {
    return PRESET_MAP.get(value) ?? [];
  }
  return value;
}
