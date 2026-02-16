import type { CurvePoint, CurvePresetName } from './curvePresets';
import { resolvePreset } from './curvePresets';
import type { ColorFormat } from './colorPalette';

// ── Types ────────────────────────────────────────────────────────────

export type LayerCount = 3 | 5 | 7;

export interface EngineParams {
  lightX: number;
  lightY: number;
  intensity: number;
  hardness: number;
  layerCount: LayerCount;
}

export type ElevationType = 'static' | 'interactive';
export type InteractionStateName = 'default' | 'hover' | 'active';

export interface InteractionStateConfig {
  intensity: number;
  hardness: number;
  depth: number;
  shadowColorHex: string;
  accentColorHex: string | null;
  componentBgHex: string;
  componentTextHex: string;
}

export interface ElevationLevel {
  name: string;
  depth: number;
  zIndex: number;
  type: ElevationType;
  layerCount?: LayerCount;
  interactionStates?: Record<InteractionStateName, InteractionStateConfig>;
  enabledStates?: Record<InteractionStateName, boolean>;
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

// ── Factory ──────────────────────────────────────────────────────────

export function createDefaultInteractionStates(
  depth: number,
  intensity: number,
  hardness: number,
  shadowColorHex: string,
  accentColorHex: string | null,
  surfaceHex: string,
): Record<InteractionStateName, InteractionStateConfig> {
  const base = { shadowColorHex, accentColorHex, componentBgHex: surfaceHex, componentTextHex: '#333333' };
  return {
    default: { depth, intensity, hardness, ...base },
    hover: { depth: Math.min(1, depth + 0.1), intensity, hardness, ...base },
    active: { depth: Math.max(0, depth - 0.05), intensity, hardness, ...base },
  };
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
    layerCount: 7,
  },
  shadowColorHex: '#170a32',
  accentColorHex: '#101756',
  preview: {
    bgHex: '#f1f1f1',
    surfaceHex: '#ffffff',
  },
  elevations: [
    { name: 'surface',
      depth: 0.15,
      zIndex: 1,
      type: 'interactive',
      enabledStates: { default: true, hover: true, active: true },
      interactionStates: {
        default: { depth: 0.15, intensity: 0.30, hardness: 0.30, shadowColorHex: '#170a32', accentColorHex: '#101756', componentBgHex: '#4158d0', componentTextHex: '#ffffff' },
        hover:   { depth: 0.45, intensity: 0.40, hardness: 0.25, shadowColorHex: '#170a32', accentColorHex: '#101756', componentBgHex: '#2c3ab4', componentTextHex: '#ffffff' },
        active:  { depth: 0.20, intensity: 0.20, hardness: 0.40, shadowColorHex: '#170a32', accentColorHex: '#101756', componentBgHex: '#2c3ab4', componentTextHex: '#ffffff' },
      }, },
    { name: 'raised', depth: 0.25, zIndex: 2, type: 'static' },
    { name: 'elevated', depth: 0.35, zIndex: 3, type: 'static' },
    { name: 'sticky',
      depth: 0.45,
      zIndex: 100,
      type: 'interactive',
      enabledStates: { default: true, hover: false, active: true },
      interactionStates: {
        default: { depth: 0.15, intensity: 0.30, hardness: 0.30, shadowColorHex: '#170a32', accentColorHex: '#101756', componentBgHex: '#ffffff', componentTextHex: '#ffffff' },
        hover:   { depth: 0.45, intensity: 0.48, hardness: 0.24, shadowColorHex: '#170a32', accentColorHex: '#101756', componentBgHex: '#ffffff', componentTextHex: '#ffffff' },
        active:  { depth: 0.65, intensity: 0.65, hardness: 0.65, shadowColorHex: '#170a32', accentColorHex: '#101756', componentBgHex: '#ffffff', componentTextHex: '#ffffff' },
      }, },
    { name: 'overlay', depth: 0.55, zIndex: 200, type: 'static' },
    { name: 'modal', depth: 0.65, zIndex: 300, type: 'static' },
    { name: 'floating', depth: 0.75, zIndex: 400, type: 'static' },
  ],
  curves: {
    layerDistribution: resolvePreset(DEFAULT_CURVES.layerDistribution),
    offsetGrowth: resolvePreset(DEFAULT_CURVES.offsetGrowth),
    alphaDistribution: resolvePreset(DEFAULT_CURVES.alphaDistribution),
  },
  colorFormat: 'oklch',
  previewLayout: 'grid',
};
