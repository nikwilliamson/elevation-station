import React, { useCallback, useMemo, useState } from 'react';

// @ts-expect-error -- JS engine module
import { buildShadowStack as _buildShadowStack } from '../engine/shadowElevationEngine.js';
import { COLOR_PALETTE, resolveHsl } from '../shared/colorPalette';

import './shadowInteractionDesigner.css';

const buildShadowStack = _buildShadowStack as (params: { depth: number; lightX: number; lightY: number; oomph: number; crispy: number; resolution: number; layerCount?: number }) => string;

// ── Types ────────────────────────────────────────────────────────────

interface InteractionStateConfig {
  oomph: number;
  crispy: number;
  depth: number;
  shadowColorHex: string;
  accentColorHex: string | null;
}

type InteractionStateName = 'default' | 'hover' | 'active';

interface PreviewConfig {
  bgHex: string;
  componentBgHex: string;
  componentTextHex: string;
}

type LayerCount = 3 | 5 | 7;

interface DesignerState {
  lightX: number;
  lightY: number;
  layerCount: LayerCount;
  states: Record<InteractionStateName, InteractionStateConfig>;
  preview: PreviewConfig;
}

type OutputFormat = 'css' | 'json';

// ── Defaults ─────────────────────────────────────────────────────────

const DEFAULT_SHADOW_COLOR = '#9636df';

const LAYER_COUNT_OPTIONS: { label: string; value: LayerCount }[] = [
  { label: 'Low', value: 3 },
  { label: 'Medium', value: 5 },
  { label: 'High', value: 7 },
];

const DEFAULT_STATE: DesignerState = {
  lightX: 0.35,
  lightY: 1.0,
  layerCount: 5,
  states: {
    default: { depth: 0.25, oomph: 0.25, crispy: 0.25, shadowColorHex: DEFAULT_SHADOW_COLOR, accentColorHex: null },
    hover: { depth: 0.40, oomph: 0.35, crispy: 0.20, shadowColorHex: DEFAULT_SHADOW_COLOR, accentColorHex: null },
    active: { depth: 0.10, oomph: 0.15, crispy: 0.40, shadowColorHex: DEFAULT_SHADOW_COLOR, accentColorHex: null },
  },
  preview: {
    bgHex: '#ffffff',
    componentBgHex: '#126bf9',
    componentTextHex: '#ffffff',
  },
};

// ── Slider configs ───────────────────────────────────────────────────

interface SliderConfig {
  label: string;
  key: string;
  min: number;
  max: number;
  step: number;
}

const STATE_SLIDERS: SliderConfig[] = [
  { label: 'Oomph', key: 'oomph', min: 0, max: 1, step: 0.01 },
  { label: 'Crispy', key: 'crispy', min: 0, max: 1, step: 0.01 },
  { label: 'Depth', key: 'depth', min: 0, max: 1, step: 0.01 },
];

const LIGHT_SLIDERS: SliderConfig[] = [
  { label: 'Light X', key: 'lightX', min: -1, max: 1, step: 0.01 },
  { label: 'Light Y', key: 'lightY', min: -1, max: 1, step: 0.01 },
];

const STATE_NAMES: InteractionStateName[] = ['default', 'hover', 'active'];

const STATE_LABELS: Record<InteractionStateName, string> = {
  default: 'Default',
  hover: 'Hover',
  active: 'Active',
};

const PREVIEW_FIELDS: { label: string; key: keyof PreviewConfig }[] = [
  { label: 'Background', key: 'bgHex' },
  { label: 'Component BG', key: 'componentBgHex' },
  { label: 'Component Text', key: 'componentTextHex' },
];

// ── ControlSlider ────────────────────────────────────────────────────

interface ControlSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

const ControlSlider: React.FC<ControlSliderProps> = ({ label, value, min, max, step, onChange }) => (
  <div className="uds-sid__slider-group">
    <label className="es-label">{label}</label>
    <div className="uds-sid__slider-row">
      <input
        type="range"
        className="uds-sid__slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="uds-sid__slider-value">{value.toFixed(2)}</span>
    </div>
  </div>
);

// ── ColorSelect ──────────────────────────────────────────────────────

const ColorSelect: React.FC<{ value: string; onChange: (hex: string) => void }> = ({ value, onChange }) => (
  <select className="uds-sid__color-select" value={value} onChange={(e) => onChange(e.target.value)}>
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

const AccentColorSelect: React.FC<{ value: string | null; onChange: (hex: string | null) => void }> = ({ value, onChange }) => (
  <select
    className="uds-sid__color-select"
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value || null)}
  >
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
);

// ── StatePanel ───────────────────────────────────────────────────────

interface StatePanelProps {
  name: InteractionStateName;
  config: InteractionStateConfig;
  isActive: boolean;
  shadowStack: string;
  shadowColorHsl: string;
  accentColorHsl: string | null;
  preview: PreviewConfig;
  onSliderChange: (key: 'oomph' | 'crispy' | 'depth', value: number) => void;
  onShadowColorChange: (hex: string) => void;
  onAccentColorChange: (hex: string | null) => void;
}

const StatePanel = React.memo<StatePanelProps>(({ name, config, isActive, shadowStack, shadowColorHsl, accentColorHsl, preview, onSliderChange, onShadowColorChange, onAccentColorChange }) => (
  <div className={`uds-sid__state-panel${isActive ? ' uds-sid__state-panel--active' : ''}`}>
    <h3 className="es-title es-title--sm">{STATE_LABELS[name]}</h3>
    <div
      className="uds-sid__state-preview"
      style={{
        backgroundColor: preview.bgHex,
        '--shadow-color': shadowColorHsl,
        ...(accentColorHsl ? { '--shadow-accent': accentColorHsl } : {}),
      } as React.CSSProperties}
    >
      <span
        className="uds-sid__state-preview-button"
        style={{
          backgroundColor: preview.componentBgHex,
          color: preview.componentTextHex,
          boxShadow: shadowStack,
        }}
      >
        Button
      </span>
    </div>
    {STATE_SLIDERS.map((slider) => (
      <ControlSlider
        key={slider.key}
        label={slider.label}
        value={config[slider.key as 'oomph' | 'crispy' | 'depth']}
        min={slider.min}
        max={slider.max}
        step={slider.step}
        onChange={(v) => onSliderChange(slider.key as 'oomph' | 'crispy' | 'depth', v)}
      />
    ))}
    <div className="uds-sid__slider-group">
      <label className="es-label">Shadow Color</label>
      <div className="uds-sid__color-row">
        <ColorSelect value={config.shadowColorHex} onChange={onShadowColorChange} />
        <div className="uds-sid__color-swatch" style={{ backgroundColor: config.shadowColorHex }} />
      </div>
    </div>
    <div className="uds-sid__slider-group">
      <label className="es-label">Accent Color</label>
      <div className="uds-sid__color-row">
        <AccentColorSelect value={config.accentColorHex} onChange={onAccentColorChange} />
        {config.accentColorHex && (
          <div className="uds-sid__color-swatch" style={{ backgroundColor: config.accentColorHex }} />
        )}
      </div>
    </div>
  </div>
));

StatePanel.displayName = 'StatePanel';

// ── GlobalControls ───────────────────────────────────────────────────

interface GlobalControlsProps {
  state: DesignerState;
  onLightChange: (key: 'lightX' | 'lightY', value: number) => void;
  onLayerCountChange: (value: LayerCount) => void;
  onPreviewChange: (key: keyof PreviewConfig, hex: string) => void;
}

const GlobalControls = React.memo<GlobalControlsProps>(({ state, onLightChange, onLayerCountChange, onPreviewChange }) => (
  <div className="uds-sid__global-panel">
    <h3 className="es-title es-title--sm">Global Controls</h3>

    <div className="uds-sid__global-section">
      {LIGHT_SLIDERS.map((slider) => (
        <ControlSlider
          key={slider.key}
          label={slider.label}
          value={state[slider.key as 'lightX' | 'lightY']}
          min={slider.min}
          max={slider.max}
          step={slider.step}
          onChange={(v) => onLightChange(slider.key as 'lightX' | 'lightY', v)}
        />
      ))}
    </div>

    <hr className="uds-sid__section-divider" />

    <div className="uds-sid__slider-group">
      <label className="es-label">Resolution</label>
      <div className="uds-sid__output-toggle">
        {LAYER_COUNT_OPTIONS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            className="uds-sid__toggle-btn"
            aria-pressed={state.layerCount === value}
            onClick={() => onLayerCountChange(value)}
          >
            {label} ({value})
          </button>
        ))}
      </div>
    </div>

    <hr className="uds-sid__section-divider" />

    <div className="uds-sid__global-section">
      {PREVIEW_FIELDS.map(({ label, key }) => (
        <div key={key} className="uds-sid__slider-group">
          <label className="es-label">{label}</label>
          <div className="uds-sid__color-row">
            <ColorSelect value={state.preview[key]} onChange={(hex) => onPreviewChange(key, hex)} />
            <div className="uds-sid__color-swatch" style={{ backgroundColor: state.preview[key] }} />
          </div>
        </div>
      ))}
    </div>
  </div>
));

GlobalControls.displayName = 'GlobalControls';

// ── InteractivePreview ───────────────────────────────────────────────

interface InteractivePreviewProps {
  shadowStacks: Record<InteractionStateName, string>;
  stateColors: Record<InteractionStateName, { shadowHsl: string; accentHsl: string | null }>;
  preview: PreviewConfig;
}

const InteractivePreview: React.FC<InteractivePreviewProps> = ({ shadowStacks, stateColors, preview }) => {
  const [currentState, setCurrentState] = useState<InteractionStateName>('default');

  const handleMouseEnter = useCallback(() => setCurrentState('hover'), []);
  const handleMouseLeave = useCallback(() => setCurrentState('default'), []);
  const handleMouseDown = useCallback(() => setCurrentState('active'), []);
  const handleMouseUp = useCallback(() => setCurrentState('hover'), []);

  const colors = stateColors[currentState];

  return (
    <div
      className="uds-sid__preview-area"
      style={{
        backgroundColor: preview.bgHex,
        '--shadow-color': colors.shadowHsl,
        ...(colors.accentHsl ? { '--shadow-accent': colors.accentHsl } : {}),
      } as React.CSSProperties}
    >
      <span
        className="uds-sid__preview-button"
        style={{
          backgroundColor: preview.componentBgHex,
          color: preview.componentTextHex,
          boxShadow: shadowStacks[currentState],
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        role="button"
        tabIndex={0}
      >
        Button
      </span>
      <span className="uds-sid__preview-state-label">{currentState}</span>
    </div>
  );
};

// ── Output formatting ────────────────────────────────────────────────

function formatCssOutput(
  stateColors: Record<InteractionStateName, { shadowHsl: string; accentHsl: string | null }>,
  shadowStacks: Record<InteractionStateName, string>,
): string {
  const lines: string[] = [];
  for (const name of STATE_NAMES) {
    const { shadowHsl, accentHsl } = stateColors[name];
    lines.push(`/* ${name} */`);
    lines.push(`--shadow-color-${name}: ${shadowHsl};`);
    if (accentHsl) {
      lines.push(`--shadow-accent-${name}: ${accentHsl};`);
    }
    lines.push(`--shadow-interaction-${name}:`);
    lines.push(`    ${shadowStacks[name]};`);
  }
  return lines.join('\n');
}

function formatTokenJson(
  stateColors: Record<InteractionStateName, { shadowHsl: string; accentHsl: string | null }>,
  state: DesignerState,
): string {
  const stateTokens: Record<string, object> = {};
  for (const name of STATE_NAMES) {
    const cfg = state.states[name];
    const { shadowHsl, accentHsl } = stateColors[name];
    stateTokens[name] = {
      depth: { $type: 'number', $value: cfg.depth },
      engine: {
        oomph: { $type: 'number', $value: cfg.oomph },
        crispy: { $type: 'number', $value: cfg.crispy },
      },
      color: {
        hsl: { $type: 'string', $value: shadowHsl },
        ...(accentHsl ? { accent_hsl: { $type: 'string', $value: accentHsl } } : {}),
      },
    };
  }

  const output = {
    interaction_shadow: {
      shadow: {
        light: {
          x: { $type: 'number', $value: state.lightX },
          y: { $type: 'number', $value: state.lightY },
        },
      },
      resolution: { $type: 'number', $value: state.layerCount },
      states: stateTokens,
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
    <div className="uds-sid__output">
      <div className="uds-sid__output-header">
        <h3 className="es-title es-title--sm">Output</h3>
        <div className="uds-sid__output-toggle">
          <button type="button" className="uds-sid__toggle-btn" aria-pressed={format === 'css'} onClick={() => setFormat('css')}>
            CSS Variables
          </button>
          <button type="button" className="uds-sid__toggle-btn" aria-pressed={format === 'json'} onClick={() => setFormat('json')}>
            Token JSON
          </button>
        </div>
      </div>
      <div className="uds-sid__output-code">
        <pre>{content}</pre>
      </div>
      <div className="uds-sid__copy-row">
        <button type="button" className={`es-btn ${copied ? 'es-btn--positive' : 'es-btn--primary'}`} onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────

export const ShadowInteractionDesigner: React.FC = () => {
  const [state, setState] = useState<DesignerState>(DEFAULT_STATE);

  // ── State panel handlers ─────────────────────────────────────────
  const handleSliderChange = useCallback((stateName: InteractionStateName, key: 'oomph' | 'crispy' | 'depth', value: number) => {
    setState((prev) => ({
      ...prev,
      states: {
        ...prev.states,
        [stateName]: { ...prev.states[stateName], [key]: value },
      },
    }));
  }, []);

  const handleStateShadowColorChange = useCallback((stateName: InteractionStateName, hex: string) => {
    setState((prev) => ({
      ...prev,
      states: {
        ...prev.states,
        [stateName]: { ...prev.states[stateName], shadowColorHex: hex },
      },
    }));
  }, []);

  const handleStateAccentColorChange = useCallback((stateName: InteractionStateName, hex: string | null) => {
    setState((prev) => ({
      ...prev,
      states: {
        ...prev.states,
        [stateName]: { ...prev.states[stateName], accentColorHex: hex },
      },
    }));
  }, []);

  // ── Global handlers ──────────────────────────────────────────────
  const handleLightChange = useCallback((key: 'lightX' | 'lightY', value: number) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleLayerCountChange = useCallback((value: LayerCount) => {
    setState((prev) => ({ ...prev, layerCount: value }));
  }, []);

  const handlePreviewChange = useCallback((key: keyof PreviewConfig, hex: string) => {
    setState((prev) => ({ ...prev, preview: { ...prev.preview, [key]: hex } }));
  }, []);

  const handleReset = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  // ── Derived values ───────────────────────────────────────────────
  const stateColors = useMemo(() => {
    const colors = {} as Record<InteractionStateName, { shadowHsl: string; accentHsl: string | null }>;
    for (const name of STATE_NAMES) {
      const cfg = state.states[name];
      colors[name] = {
        shadowHsl: resolveHsl(cfg.shadowColorHex),
        accentHsl: cfg.accentColorHex ? resolveHsl(cfg.accentColorHex) : null,
      };
    }
    return colors;
  }, [state.states]);

  // All states share the same layerCount, so CSS box-shadow transitions interpolate smoothly.
  const shadowStacks = useMemo(() => {
    const stacks = {} as Record<InteractionStateName, string>;
    for (const name of STATE_NAMES) {
      const cfg = state.states[name];
      stacks[name] = buildShadowStack({
        depth: cfg.depth,
        lightX: state.lightX,
        lightY: state.lightY,
        oomph: cfg.oomph,
        crispy: cfg.crispy,
        resolution: 0,
        layerCount: state.layerCount,
      });
    }
    return stacks;
  }, [state.states, state.lightX, state.lightY, state.layerCount]);

  const cssOutput = useMemo(() => formatCssOutput(stateColors, shadowStacks), [stateColors, shadowStacks]);
  const jsonOutput = useMemo(() => formatTokenJson(stateColors, state), [stateColors, state]);

  return (
    <div className="uds-sid">
      {/* Header */}
      <div className="uds-sid__header">
        <h2 className="es-title es-title--lg">Shadow Interaction Designer</h2>
        <button type="button" className="es-btn es-btn--ghost" onClick={handleReset}>
          Reset Defaults
        </button>
      </div>

      {/* Interactive Preview */}
      <InteractivePreview
        shadowStacks={shadowStacks}
        stateColors={stateColors}
        preview={state.preview}
      />

      {/* Controls: 3 state panels + global */}
      <div className="uds-sid__controls">
        {STATE_NAMES.map((name) => (
          <StatePanel
            key={name}
            name={name}
            config={state.states[name]}
            isActive={false}
            shadowStack={shadowStacks[name]}
            shadowColorHsl={stateColors[name].shadowHsl}
            accentColorHsl={stateColors[name].accentHsl}
            preview={state.preview}
            onSliderChange={(key, value) => handleSliderChange(name, key, value)}
            onShadowColorChange={(hex) => handleStateShadowColorChange(name, hex)}
            onAccentColorChange={(hex) => handleStateAccentColorChange(name, hex)}
          />
        ))}
        <GlobalControls
          state={state}
          onLightChange={handleLightChange}
          onLayerCountChange={handleLayerCountChange}
          onPreviewChange={handlePreviewChange}
        />
      </div>

      {/* Output */}
      <OutputSection cssOutput={cssOutput} jsonOutput={jsonOutput} />
    </div>
  );
};
