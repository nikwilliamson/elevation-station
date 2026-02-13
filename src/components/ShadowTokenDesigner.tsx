import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

import { BezierCurveEditor, type CurvePoint } from './BezierCurveEditor';
// @ts-expect-error -- JS engine module
import { buildShadowStack as _buildShadowStack } from '../engine/shadowElevationEngine.js';
import { COLOR_PALETTE, COLOR_HSL_MAP, hexToHsl } from '../shared/colorPalette';

import './shadowTokenDesigner.css';

interface ShadowCurves {
  layerDistribution?: CurvePoint[];
  offsetGrowth?: CurvePoint[];
  alphaDistribution?: CurvePoint[];
}

const buildShadowStack = _buildShadowStack as (params: { depth: number; lightX: number; lightY: number; oomph: number; crispy: number; resolution: number; layerCount?: number; curves?: ShadowCurves }) => string;

// Find the default color's closest match (plum-500)
const DEFAULT_COLOR_HEX = '#9636df';

// ── Types ────────────────────────────────────────────────────────────

interface EngineParams {
  lightX: number;
  lightY: number;
  oomph: number;
  crispy: number;
  resolution: number;
}

interface ElevationLevel {
  name: string;
  depth: number;
}

interface PreviewConfig {
  bgHex: string;
}

interface PaletteState {
  engine: EngineParams;
  shadowColorHex: string;
  accentColorHex: string | null;
  preview: PreviewConfig;
  elevations: ElevationLevel[];
  curves: ShadowCurves;
}

type OutputFormat = 'css' | 'json';

// ── Defaults (from elevation_new.alias.tokens.json) ──────────────────

const DEFAULT_ENGINE: EngineParams = {
  lightX: 0.35,
  lightY: 1.0,
  oomph: 0.25,
  crispy: 0.25,
  resolution: 0.75,
};

const DEFAULT_ELEVATIONS: ElevationLevel[] = [
  { name: 'surface', depth: 0.15 },
  { name: 'raised', depth: 0.25 },
  { name: 'elevated', depth: 0.35 },
  { name: 'sticky', depth: 0.45 },
  { name: 'overlay', depth: 0.55 },
  { name: 'modal', depth: 0.65 },
  { name: 'floating', depth: 0.75 },
  { name: 'drag', depth: 0.85 },
];

const DEFAULT_PREVIEW: PreviewConfig = {
  bgHex: '#ffffff',
};

const DEFAULT_CURVES: ShadowCurves = {
  layerDistribution: [],
  offsetGrowth: [],
  alphaDistribution: [],
};

const DEFAULT_STATE: PaletteState = {
  engine: DEFAULT_ENGINE,
  shadowColorHex: DEFAULT_COLOR_HEX,
  accentColorHex: null,
  preview: DEFAULT_PREVIEW,
  elevations: DEFAULT_ELEVATIONS,
  curves: DEFAULT_CURVES,
};

// ── Slider config ────────────────────────────────────────────────────

interface SliderConfig {
  label: string;
  description: string;
  key: keyof EngineParams;
  min: number;
  max: number;
  step: number;
}

const ENGINE_SLIDERS: SliderConfig[] = [
  { label: 'Oomph', description: 'Overall shadow intensity and darkness', key: 'oomph', min: 0, max: 1, step: 0.01 },
  { label: 'Crispy', description: 'Edge sharpness from soft to hard', key: 'crispy', min: 0, max: 1, step: 0.01 },
  { label: 'Resolution', description: 'Number of layers in the shadow stack', key: 'resolution', min: 0, max: 1, step: 0.01 },
];

// ── ControlSlider ────────────────────────────────────────────────────

interface ControlSliderProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

const ControlSlider: React.FC<ControlSliderProps> = ({ label, description, value, min, max, step, onChange }) => (
  <div className="uds-shadow-palette-generator__slider-group">
    <label className="es-label">{label}</label>
    {description && <p className="uds-shadow-palette-generator__field-description">{description}</p>}
    <div className="uds-shadow-palette-generator__slider-row">
      <input type="range" className="uds-shadow-palette-generator__slider" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="uds-shadow-palette-generator__slider-value">{value.toFixed(2)}</span>
    </div>
  </div>
);

// ── LightPositionPad ─────────────────────────────────────────────────

interface LightPositionPadProps {
  lightX: number;
  lightY: number;
  onChangeX: (value: number) => void;
  onChangeY: (value: number) => void;
}

/** Spring configs for the light position pad */
const LIGHT_SPRING = { stiffness: 400, damping: 35, restDelta: 0.001 };
const SUN_SCALE_SPRING = { stiffness: 500, damping: 25 };

const LightPositionPad: React.FC<LightPositionPadProps> = ({ lightX, lightY, onChangeX, onChangeY }) => {
  const padRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // Motion values → springs for smooth sun position
  const rawX = useMotionValue(lightX);
  const rawY = useMotionValue(lightY);
  const springX = useSpring(rawX, LIGHT_SPRING);
  const springY = useSpring(rawY, LIGHT_SPRING);

  // Map light coords (-1…1) → percentage offsets from center
  const x = useTransform(springX, (v) => `${((-v + 1) / 2) * 100}%`);
  const y = useTransform(springY, (v) => `${((-v + 1) / 2) * 100}%`);

  // Scale spring: grows when grabbed
  const sunScale = useSpring(1, SUN_SCALE_SPRING);

  // Sync incoming prop changes (Reset, external) → spring to new position
  useEffect(() => {
    if (!dragging) {
      rawX.set(lightX);
      rawY.set(lightY);
    }
  }, [lightX, lightY, dragging, rawX, rawY]);

  const updateFromPointer = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      const pad = padRef.current;
      if (!pad) return;
      const rect = pad.getBoundingClientRect();
      // Pad shows light position; engine uses shadow direction — invert both axes
      const nx = Math.max(-1, Math.min(1, -(((e.clientX - rect.left) / rect.width) * 2 - 1)));
      const ny = Math.max(-1, Math.min(1, -(((e.clientY - rect.top) / rect.height) * 2 - 1)));
      const rx = Math.round(nx * 100) / 100;
      const ry = Math.round(ny * 100) / 100;
      rawX.set(rx);
      rawY.set(ry);
      onChangeX(rx);
      onChangeY(ry);
    },
    [onChangeX, onChangeY, rawX, rawY],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);
      setDragging(true);
      sunScale.set(1.4);
      updateFromPointer(e);
    },
    [updateFromPointer, sunScale],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      updateFromPointer(e);
    },
    [dragging, updateFromPointer],
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    sunScale.set(1);
  }, [sunScale]);

  return (
    <div className="uds-shadow-palette-generator__light-pad-wrapper">
      <div ref={padRef} className="uds-shadow-palette-generator__light-pad" style={{ cursor: dragging ? 'grabbing' : 'crosshair' }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        {/* Sun indicator — spring-animated position + scale */}
        <motion.div className="uds-shadow-palette-generator__light-pad-sun" data-active={dragging || undefined} style={{ left: x, top: y, scale: sunScale }} />
      </div>
      <div className="uds-bezier-editor__coords">
        <span className="uds-bezier-editor__coord">x: {lightX.toFixed(2)}</span>
        <span className="uds-bezier-editor__coord">y: {lightY.toFixed(2)}</span>
      </div>
    </div>
  );
};

// ── EngineControls ───────────────────────────────────────────────────

interface EngineControlsProps {
  engine: EngineParams;
  shadowColorHex: string;
  accentColorHex: string | null;
  onEngineChange: (key: keyof EngineParams, value: number) => void;
  onColorChange: (hex: string) => void;
  onAccentColorChange: (hex: string | null) => void;
}

const ColorSelect: React.FC<{ value: string; onChange: (hex: string) => void }> = ({ value, onChange }) => (
  <select className="uds-shadow-palette-generator__color-select" value={value} onChange={(e) => onChange(e.target.value)}>
    {COLOR_PALETTE.map((family) => (
      <optgroup key={family.name} label={family.name}>
        {family.shades.map((shade) => (
          <option key={shade.hex} value={shade.hex}>
            {family.name.toLowerCase()}-{shade.shade}
          </option>
        ))}
      </optgroup>
    ))}
  </select>
);

// ── CurveControls ────────────────────────────────────────────────────

interface CurveControlsProps {
  curves: ShadowCurves;
  onCurveChange: (key: keyof ShadowCurves, points: CurvePoint[]) => void;
}

const CURVE_EDITORS: { label: string; description: string; key: keyof ShadowCurves; color: string }[] = [
  { label: 'Layer Distribution', description: 'How shadow layers are spaced from contact to edge', key: 'layerDistribution', color: '#126bf9' },
  { label: 'Offset Growth', description: 'How offset scales with depth elevation', key: 'offsetGrowth', color: '#126bf9' },
  { label: 'Alpha Distribution', description: 'How opacity is shaped across layers', key: 'alphaDistribution', color: '#9636df' },
];

interface ControlsGridProps extends CurveControlsProps, EngineControlsProps {}

const ControlsGrid: React.FC<ControlsGridProps> = ({ curves, onCurveChange, engine, shadowColorHex, accentColorHex, onEngineChange, onColorChange, onAccentColorChange }) => {
  const handlers = useMemo(() => Object.fromEntries(CURVE_EDITORS.map(({ key }) => [key, (points: CurvePoint[]) => onCurveChange(key, points)])) as Record<keyof ShadowCurves, (points: CurvePoint[]) => void>, [onCurveChange]);

  return (
    <div className="uds-shadow-palette-generator__controls-grid">
      <div className="uds-shadow-palette-generator__controls-grid-cell">
        <label className="es-label">Shadow Engine</label>
        <p className="uds-shadow-palette-generator__curve-cell-description">Core parameters that shape the shadow output</p>
        <EngineControls engine={engine} shadowColorHex={shadowColorHex} accentColorHex={accentColorHex} onEngineChange={onEngineChange} onColorChange={onColorChange} onAccentColorChange={onAccentColorChange} />
      </div>
      {/* Light position */}
      <div className="uds-shadow-palette-generator__controls-grid-cell">
        <label className="es-label">Light Position</label>
        <p className="uds-shadow-palette-generator__curve-cell-description">Where the light source is relative to the surface</p>
        <LightPositionPad lightX={engine.lightX} lightY={engine.lightY} onChangeX={(v) => onEngineChange('lightX', v)} onChangeY={(v) => onEngineChange('lightY', v)} />
      </div>

      {/* Curve editors */}
      {CURVE_EDITORS.map(({ label, description, key, color }) => (
        <div key={key} className="uds-shadow-palette-generator__controls-grid-cell">
          <label className="es-label">{label}</label>
          <p className="uds-shadow-palette-generator__curve-cell-description">{description}</p>
          <BezierCurveEditor points={curves[key] ?? []} onChange={handlers[key]} color={color} />
        </div>
      ))}
    </div>
  );
};

const EngineControls: React.FC<EngineControlsProps> = ({ engine, shadowColorHex, accentColorHex, onEngineChange, onColorChange, onAccentColorChange }) => (
  <div className="uds-shadow-palette-generator__engine-panel">
    {ENGINE_SLIDERS.map((slider) => (
      <ControlSlider key={slider.key} label={slider.label} description={slider.description} value={engine[slider.key]} min={slider.min} max={slider.max} step={slider.step} onChange={(v) => onEngineChange(slider.key, v)} />
    ))}
    <div className="uds-shadow-palette-generator__slider-group">
      <label className="es-label">Shadow Color</label>
      <p className="uds-shadow-palette-generator__field-description">Base color for tight contact layers</p>
      <div className="uds-shadow-palette-generator__color-row">
        <ColorSelect value={shadowColorHex} onChange={onColorChange} />
        <div className="uds-shadow-palette-generator__color-swatch" style={{ backgroundColor: shadowColorHex }} />
      </div>
    </div>
    <div className="uds-shadow-palette-generator__slider-group">
      <label className="es-label">Accent Color (glow)</label>
      <p className="uds-shadow-palette-generator__field-description">Color for outer atmospheric layers</p>
      <div className="uds-shadow-palette-generator__color-row">
        <select className="uds-shadow-palette-generator__color-select" value={accentColorHex ?? ''} onChange={(e) => onAccentColorChange(e.target.value || null)}>
          <option value="">None (use shadow color)</option>
          {COLOR_PALETTE.map((family) => (
            <optgroup key={family.name} label={family.name}>
              {family.shades.map((shade) => (
                <option key={shade.hex} value={shade.hex}>
                  {family.name.toLowerCase()}-{shade.shade}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="uds-shadow-palette-generator__color-swatch" style={{ backgroundColor: accentColorHex ?? shadowColorHex }} />
      </div>
    </div>
  </div>
);

// ── PreviewControls ──────────────────────────────────────────────

interface PreviewControlsProps {
  preview: PreviewConfig;
  onPreviewChange: (key: keyof PreviewConfig, hex: string) => void;
}

const PREVIEW_FIELDS: { label: string; key: keyof PreviewConfig }[] = [{ label: 'Background', key: 'bgHex' }];

const PreviewControls: React.FC<PreviewControlsProps> = ({ preview, onPreviewChange }) => (
  <div className="uds-shadow-palette-generator__preview-panel">
    <h3 className="es-title es-title--sm">Preview</h3>
    {PREVIEW_FIELDS.map(({ label, key }) => (
      <div key={key} className="uds-shadow-palette-generator__slider-group">
        <label className="es-label">{label}</label>
        <div className="uds-shadow-palette-generator__color-row">
          <ColorSelect value={preview[key]} onChange={(hex) => onPreviewChange(key, hex)} />
          <div className="uds-shadow-palette-generator__color-swatch" style={{ backgroundColor: preview[key] }} />
        </div>
      </div>
    ))}
  </div>
);

// ── ElevationCard ────────────────────────────────────────────────────

interface ElevationCardProps {
  index: number;
  depth: number;
  shadowStack: string;
  preview: PreviewConfig;
  onDepthChange: (depth: number) => void;
  onRemove: () => void;
  canRemove: boolean;
}

const ElevationCard = React.memo<ElevationCardProps>(({ index, depth, shadowStack, preview, onDepthChange, onRemove, canRemove }) => (
  <div className="uds-shadow-palette-generator__elevation-card">
    <div className="uds-shadow-palette-generator__elevation-info">
      <div className="uds-shadow-palette-generator__elevation-header">
        <span className="uds-shadow-palette-generator__elevation-name">Elevation {index + 1}</span>
        {canRemove && (
          <button type="button" className="uds-shadow-palette-generator__elevation-remove" onClick={onRemove} aria-label="Remove elevation">
            &times;
          </button>
        )}
      </div>
      <div className="uds-shadow-palette-generator__slider-row">
        <input type="range" className="uds-shadow-palette-generator__slider" min={0} max={1} step={0.01} value={depth} onChange={(e) => onDepthChange(Number(e.target.value))} />
        <span className="uds-shadow-palette-generator__elevation-depth">{depth.toFixed(2)}</span>
      </div>
    </div>
    <div className="uds-shadow-palette-generator__preview-surface" style={{ backgroundColor: preview.bgHex }}>
      <div className="uds-shadow-palette-generator__preview-card" style={{ boxShadow: shadowStack }} />
    </div>
  </div>
));

ElevationCard.displayName = 'ElevationCard';

// ── Output formatting ────────────────────────────────────────────────

function formatCssOutput(shadowColorHsl: string, accentColorHsl: string | null, state: PaletteState, shadowStacks: string[]): string {
  const lines: string[] = [`--shadow-color: ${shadowColorHsl};`];
  if (accentColorHsl) {
    lines.push(`--shadow-accent: ${accentColorHsl};`);
  }
  state.elevations.forEach((level, i) => {
    const varName = level.name.startsWith('level-') ? `elevation-${i + 1}` : `elevation-${level.name}`;
    lines.push(`--shadow-${varName}:`);
    lines.push(`    ${shadowStacks[i]};`);
  });
  return lines.join('\n');
}

function formatTokenJson(shadowColorHsl: string, state: PaletteState): string {
  const engineTokens: Record<string, { $type: string; $value: number }> = {};
  for (const key of Object.keys(state.engine) as (keyof EngineParams)[]) {
    engineTokens[key] = { $type: 'number', $value: state.engine[key] };
  }

  const elevationTokens: Record<string, { depth: { $type: string; $value: number } }> = {};
  for (const level of state.elevations) {
    elevationTokens[level.name] = { depth: { $type: 'number', $value: level.depth } };
  }

  const output = {
    elevation_new: {
      shadow: {
        engine: engineTokens,
        color: {
          hsl: { $type: 'string', $value: shadowColorHsl },
        },
      },
      elevation: elevationTokens,
    },
  };

  return JSON.stringify(output, null, 2);
}

// ── OutputSection ────────────────────────────────────────────────────

interface OutputSectionProps {
  cssOutput: string;
  jsonOutput: string;
}

const OutputSection: React.FC<OutputSectionProps> = ({ cssOutput, jsonOutput }) => {
  const [format, setFormat] = useState<OutputFormat>('css');
  const [copied, setCopied] = useState(false);

  const content = format === 'css' ? cssOutput : jsonOutput;

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [content]);

  return (
    <div className="uds-shadow-palette-generator__output">
      <div className="uds-shadow-palette-generator__output-header">
        <h3 className="es-title es-title--sm">Output</h3>
        <div className="uds-shadow-palette-generator__output-toggle">
          <button type="button" className="uds-shadow-palette-generator__toggle-btn" aria-pressed={format === 'css'} onClick={() => setFormat('css')}>
            CSS Variables
          </button>
          <button type="button" className="uds-shadow-palette-generator__toggle-btn" aria-pressed={format === 'json'} onClick={() => setFormat('json')}>
            Token JSON
          </button>
        </div>
      </div>
      <div className="uds-shadow-palette-generator__output-code">
        <pre>{content}</pre>
      </div>
      <div className="uds-shadow-palette-generator__copy-row">
        <button type="button" className={`es-btn ${copied ? 'es-btn--positive' : 'es-btn--primary'}`} onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────

export const ShadowTokenDesigner: React.FC = () => {
  const [state, setState] = useState<PaletteState>(DEFAULT_STATE);

  const handleEngineChange = useCallback((key: keyof EngineParams, value: number) => {
    setState((prev) => ({ ...prev, engine: { ...prev.engine, [key]: value } }));
  }, []);

  const handleColorChange = useCallback((hex: string) => {
    setState((prev) => ({ ...prev, shadowColorHex: hex }));
  }, []);

  const handleAccentColorChange = useCallback((hex: string | null) => {
    setState((prev) => ({ ...prev, accentColorHex: hex }));
  }, []);

  const handlePreviewChange = useCallback((key: keyof PreviewConfig, hex: string) => {
    setState((prev) => ({ ...prev, preview: { ...prev.preview, [key]: hex } }));
  }, []);

  const handleDepthChange = useCallback((index: number, depth: number) => {
    setState((prev) => ({
      ...prev,
      elevations: prev.elevations.map((el, i) => (i === index ? { ...el, depth } : el)),
    }));
  }, []);

  const handleReset = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const handleAddElevation = useCallback(() => {
    setState((prev) => {
      const last = prev.elevations[prev.elevations.length - 1];
      const newDepth = Math.min(1, (last?.depth ?? 0.5) + 0.1);
      const newName = `level-${prev.elevations.length + 1}`;
      return { ...prev, elevations: [...prev.elevations, { name: newName, depth: newDepth }] };
    });
  }, []);

  const handleRemoveElevation = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      elevations: prev.elevations.filter((_, i) => i !== index),
    }));
  }, []);

  const handleCurveChange = useCallback((key: keyof ShadowCurves, points: CurvePoint[]) => {
    setState((prev) => ({ ...prev, curves: { ...prev.curves, [key]: points } }));
  }, []);

  // Derive HSL from selected hex
  const shadowColorHsl = useMemo(() => COLOR_HSL_MAP.get(state.shadowColorHex) ?? hexToHsl(state.shadowColorHex), [state.shadowColorHex]);
  const accentColorHsl = useMemo(() => (state.accentColorHex ? (COLOR_HSL_MAP.get(state.accentColorHex) ?? hexToHsl(state.accentColorHex)) : null), [state.accentColorHex]);

  // Derive shadow stacks from engine params + elevation depths + curves
  const shadowStacks = useMemo(
    () =>
      state.elevations.map((level): string =>
        buildShadowStack({
          depth: level.depth,
          lightX: state.engine.lightX,
          lightY: state.engine.lightY,
          oomph: state.engine.oomph,
          crispy: state.engine.crispy,
          resolution: state.engine.resolution,
          curves: state.curves,
        }),
      ),
    [state.engine, state.elevations, state.curves],
  );

  const cssOutput = useMemo(() => formatCssOutput(shadowColorHsl, accentColorHsl, state, shadowStacks), [shadowColorHsl, accentColorHsl, state, shadowStacks]);
  const jsonOutput = useMemo(() => formatTokenJson(shadowColorHsl, state), [shadowColorHsl, state]);

  return (
    <div className="uds-shadow-palette-generator" style={{ '--shadow-color': shadowColorHsl, ...(accentColorHsl ? { '--shadow-accent': accentColorHsl } : {}) } as React.CSSProperties}>
      {/* Header */}
      <div className="uds-shadow-palette-generator__header">
        <h2 className="es-title es-title--lg">Shadow Palette Generator</h2>
        <button type="button" className="es-btn es-btn--ghost" onClick={handleReset}>
          Reset Defaults
        </button>
      </div>

      {/* Controls grid: light pad, engine sliders, and 3 curve editors */}
      <ControlsGrid
        curves={state.curves}
        onCurveChange={handleCurveChange}
        engine={state.engine}
        shadowColorHex={state.shadowColorHex}
        accentColorHex={state.accentColorHex}
        onEngineChange={handleEngineChange}
        onColorChange={handleColorChange}
        onAccentColorChange={handleAccentColorChange}
      />

      {/* Preview controls + elevation levels */}
      <div className="uds-shadow-palette-generator__previews-section">
        <PreviewControls preview={state.preview} onPreviewChange={handlePreviewChange} />
        <div className="uds-shadow-palette-generator__levels">
          {state.elevations.map((level, i) => (
            <ElevationCard
              key={`${level.name}-${i}`}
              index={i}
              depth={level.depth}
              shadowStack={shadowStacks[i]}
              preview={state.preview}
              onDepthChange={(d) => handleDepthChange(i, d)}
              onRemove={() => handleRemoveElevation(i)}
              canRemove={state.elevations.length > 1}
            />
          ))}
          <button type="button" className="uds-shadow-palette-generator__add-elevation" onClick={handleAddElevation}>
            + Add Elevation
          </button>
        </div>
      </div>

      {/* Output */}
      <OutputSection cssOutput={cssOutput} jsonOutput={jsonOutput} />

      {/* Engine Reference */}
      <div className="uds-shadow-palette-generator__reference">
        <table className="uds-shadow-palette-generator__reference-table">
          <thead>
            <tr>
              <th />
              <th>Low Depth</th>
              <th>Mid Depth</th>
              <th>High Depth</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Low Oomph, Low Crispy</th>
              <td>Barely visible, soft diffuse haze</td>
              <td>Gentle lift, wide ambient blur</td>
              <td>Tall but whisper-light, very soft</td>
            </tr>
            <tr>
              <th>Low Oomph, High Crispy</th>
              <td>Dark contact edge fading outward, tight</td>
              <td>Defined silhouette, hard edge, subtle</td>
              <td>Sharp cutout shadow, light but precise</td>
            </tr>
            <tr>
              <th>High Oomph, Low Crispy</th>
              <td>Light contact, dark atmospheric buildup</td>
              <td>Moody diffused glow, builds outward</td>
              <td>Massive dark cloud, heavy soft presence</td>
            </tr>
            <tr>
              <th>High Oomph, High Crispy</th>
              <td>Bold hard edge, concentrated at boundary</td>
              <td>Strong spot shadow, crisp definition</td>
              <td>Maximum drama — dark hard edge, spot light</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
