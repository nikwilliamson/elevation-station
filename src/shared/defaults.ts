import type { CurvePoint, CurvePresetName } from './curvePresets';
import { resolvePreset } from './curvePresets';
import type { ColorFormat } from './colorPalette';

// ── Types ────────────────────────────────────────────────────────────

export interface EngineParams {
  lightX: number;
  lightY: number;
  intensity: number;
  hardness: number;
  resolution: number;
}

export interface ElevationLevel {
  name: string;
  depth: number;
  zIndex: number;
}

export interface PreviewConfig {
  bgHex: string;
  surfaceHex: string;
}

export interface ShadowCurves {
  layerDistribution?: CurvePoint[];
  offsetGrowth?: CurvePoint[];
  alphaDistribution?: CurvePoint[];
}

export type PreviewLayout = 'list' | 'grid';

export interface PaletteState {
  engine: EngineParams;
  shadowColorHex: string;
  accentColorHex: string | null;
  preview: PreviewConfig;
  elevations: ElevationLevel[];
  curves: ShadowCurves;
  colorFormat: ColorFormat;
  previewLayout: PreviewLayout;
}

// ── Default curve specs (preset name or raw points) ──────────────────

type CurveSpec = CurvePresetName | CurvePoint[];

interface DefaultCurves {
  layerDistribution: CurveSpec;
  offsetGrowth: CurveSpec;
  alphaDistribution: CurveSpec;
}

// ── Defaults ─────────────────────────────────────────────────────────

const DEFAULT_CURVES: DefaultCurves = {
  layerDistribution: 'Early Burst',
  offsetGrowth: 'Late Bloom',
  alphaDistribution: 'Ease In',
};

export const DEFAULTS: PaletteState = {
  engine: {
    lightX: 0.24,
    lightY: 0.64,
    intensity: 0.64,
    hardness: 0.80,
    resolution: 0.96,
  },
  shadowColorHex: '#482901',
  accentColorHex: '#c850c0',
  preview: {
    bgHex: '#ffcc70',
    surfaceHex: '#ffffff',
  },
  elevations: [
    { name: 'surface', depth: 0.15, zIndex: 1 },
    { name: 'raised', depth: 0.25, zIndex: 2 },
    { name: 'elevated', depth: 0.35, zIndex: 3 },
    { name: 'sticky', depth: 0.45, zIndex: 100 },
    { name: 'overlay', depth: 0.55, zIndex: 200 },
    { name: 'modal', depth: 0.65, zIndex: 300 },
    { name: 'floating', depth: 0.75, zIndex: 400 },
    { name: 'drag', depth: 0.85, zIndex: 500 },
  ],
  curves: {
    layerDistribution: resolvePreset(DEFAULT_CURVES.layerDistribution),
    offsetGrowth: resolvePreset(DEFAULT_CURVES.offsetGrowth),
    alphaDistribution: resolvePreset(DEFAULT_CURVES.alphaDistribution),
  },
  colorFormat: 'oklch',
  previewLayout: 'grid',
};
