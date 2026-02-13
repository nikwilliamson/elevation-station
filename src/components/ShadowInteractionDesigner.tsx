import React, { useCallback, useMemo, useState } from "react"

import { ControlSlider } from "./ControlSlider"
import { OutputSection } from "./OutputSection"
import { ToggleButtonGroup } from "./ToggleButtonGroup"
// @ts-expect-error -- JS engine module
import { buildShadowStack as _buildShadowStack } from "../engine/shadowElevationEngine.js"
import { resolveHsl } from "../shared/colorPalette"
import { ColorPicker } from "./ColorPicker"
import { FieldLabel } from "./FieldLabel"
import { Button } from "./Button"

import "./shadowInteractionDesigner.css"

const buildShadowStack = _buildShadowStack as (params: { depth: number; lightX: number; lightY: number; intensity: number; hardness: number; resolution: number; layerCount?: number }) => string

/* ── Types ─────────────────────────────────────────────────────── */

interface InteractionStateConfig {
  intensity: number
  hardness: number
  depth: number
  shadowColorHex: string
  accentColorHex: string | null
}

type InteractionStateName = "default" | "hover" | "active"

interface PreviewConfig {
  bgHex: string
  componentBgHex: string
  componentTextHex: string
}

type LayerCount = 3 | 5 | 7

interface DesignerState {
  lightX: number
  lightY: number
  layerCount: LayerCount
  states: Record<InteractionStateName, InteractionStateConfig>
  preview: PreviewConfig
}

/* ── Defaults ────────────────────────────────────────────────────── */

const DEFAULT_SHADOW_COLOR = "#9636df"

const LAYER_COUNT_OPTIONS: { label: string; value: LayerCount }[] = [
  { label: "Low (3)", value: 3 },
  { label: "Medium (5)", value: 5 },
  { label: "High (7)", value: 7 },
]

const DEFAULT_STATE: DesignerState = {
  lightX: 0.35,
  lightY: 1.0,
  layerCount: 5,
  states: {
    default: { depth: 0.25, intensity: 0.25, hardness: 0.25, shadowColorHex: DEFAULT_SHADOW_COLOR, accentColorHex: null },
    hover: { depth: 0.40, intensity: 0.35, hardness: 0.20, shadowColorHex: DEFAULT_SHADOW_COLOR, accentColorHex: null },
    active: { depth: 0.10, intensity: 0.15, hardness: 0.40, shadowColorHex: DEFAULT_SHADOW_COLOR, accentColorHex: null },
  },
  preview: {
    bgHex: "#ffffff",
    componentBgHex: "#C850C0",
    componentTextHex: "#ffffff",
  },
}

/* ── Slider configs ──────────────────────────────────────────────── */

interface SliderConfig {
  label: string
  key: string
  min: number
  max: number
  step: number
}

const STATE_SLIDERS: SliderConfig[] = [
  { label: "Intensity", key: "intensity", min: 0, max: 1, step: 0.01 },
  { label: "Hardness", key: "hardness", min: 0, max: 1, step: 0.01 },
  { label: "Depth", key: "depth", min: 0, max: 1, step: 0.01 },
]

const LIGHT_SLIDERS: SliderConfig[] = [
  { label: "Light X", key: "lightX", min: -1, max: 1, step: 0.01 },
  { label: "Light Y", key: "lightY", min: -1, max: 1, step: 0.01 },
]

const STATE_NAMES: InteractionStateName[] = ["default", "hover", "active"]

const STATE_LABELS: Record<InteractionStateName, string> = {
  default: "Default",
  hover: "Hover",
  active: "Active",
}

const PREVIEW_FIELDS: { label: string; key: keyof PreviewConfig }[] = [
  { label: "Background", key: "bgHex" },
  { label: "Component BG", key: "componentBgHex" },
  { label: "Component Text", key: "componentTextHex" },
]

/* ── StatePanel ──────────────────────────────────────────────────── */

interface StatePanelProps {
  name: InteractionStateName
  config: InteractionStateConfig
  isActive: boolean
  shadowStack: string
  shadowColorHsl: string
  accentColorHsl: string | null
  preview: PreviewConfig
  onSliderChange: (key: "intensity" | "hardness" | "depth", value: number) => void
  onShadowColorChange: (hex: string) => void
  onAccentColorChange: (hex: string | null) => void
}

const StatePanel = React.memo<StatePanelProps>(({ name, config, isActive, shadowStack, shadowColorHsl, accentColorHsl, preview, onSliderChange, onShadowColorChange, onAccentColorChange }) => (
  <div className={`es-interaction-designer__state-panel${isActive ? " es-interaction-designer__state-panel--active" : ""}`}>
    <h3 className="es-title es-title--sm">{STATE_LABELS[name]}</h3>
    <div
      className="es-interaction-designer__state-preview"
      style={{
        backgroundColor: preview.bgHex,
        "--shadow-color": shadowColorHsl,
        ...(accentColorHsl ? { "--shadow-accent": accentColorHsl } : {}),
      } as React.CSSProperties}
    >
      <span
        className="es-interaction-designer__state-preview-button"
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
        size="sm"
        value={config[slider.key as "intensity" | "hardness" | "depth"]}
        min={slider.min}
        max={slider.max}
        step={slider.step}
        onChange={(v) => onSliderChange(slider.key as "intensity" | "hardness" | "depth", v)}
      />
    ))}
    <ColorPicker label="Shadow Color" labelSize="sm" value={config.shadowColorHex} onChange={onShadowColorChange} />
    <div className="es-interaction-designer__slider-group">
      <ColorPicker
        label="Accent Color"
        labelSize="sm"
        value={config.accentColorHex ?? config.shadowColorHex}
        onChange={(hex) => onAccentColorChange(hex)}
        disabled={!config.accentColorHex}
        toggle={config.accentColorHex ? "on" : "off"}
        onToggleChange={(v) => onAccentColorChange(v === "on" ? config.shadowColorHex : null)}
      />
    </div>
  </div>
))

StatePanel.displayName = "StatePanel"

/* ── GlobalControls ──────────────────────────────────────────────── */

interface GlobalControlsProps {
  state: DesignerState
  onLightChange: (key: "lightX" | "lightY", value: number) => void
  onLayerCountChange: (value: LayerCount) => void
  onPreviewChange: (key: keyof PreviewConfig, hex: string) => void
}

const GlobalControls = React.memo<GlobalControlsProps>(({ state, onLightChange, onLayerCountChange, onPreviewChange }) => (
  <div className="es-interaction-designer__global-panel">
    <h3 className="es-title es-title--sm">Global Controls</h3>

    <div className="es-interaction-designer__global-section">
      {LIGHT_SLIDERS.map((slider) => (
        <ControlSlider
          key={slider.key}
          label={slider.label}
          size="sm"
          value={state[slider.key as "lightX" | "lightY"]}
          min={slider.min}
          max={slider.max}
          step={slider.step}
          onChange={(v) => onLightChange(slider.key as "lightX" | "lightY", v)}
        />
      ))}
    </div>

    <hr className="es-interaction-designer__section-divider" />

    <div className="es-interaction-designer__slider-group">
      <FieldLabel size="sm" label="Resolution" />
      <ToggleButtonGroup options={LAYER_COUNT_OPTIONS} value={state.layerCount} onChange={onLayerCountChange} />
    </div>

    <hr className="es-interaction-designer__section-divider" />

    <div className="es-interaction-designer__global-section">
      {PREVIEW_FIELDS.map(({ label, key }) => (
        <div key={key} className="es-interaction-designer__slider-group">
          <ColorPicker label={label} labelSize="sm" value={state.preview[key]} onChange={(hex) => onPreviewChange(key, hex)} />
        </div>
      ))}
    </div>
  </div>
))

GlobalControls.displayName = "GlobalControls"

/* ── InteractivePreview ──────────────────────────────────────────── */

interface InteractivePreviewProps {
  shadowStacks: Record<InteractionStateName, string>
  stateColors: Record<InteractionStateName, { shadowHsl: string; accentHsl: string | null }>
  preview: PreviewConfig
}

function InteractivePreview({ shadowStacks, stateColors, preview }: InteractivePreviewProps) {
  const [currentState, setCurrentState] = useState<InteractionStateName>("default")

  const handleMouseEnter = useCallback(() => setCurrentState("hover"), [])
  const handleMouseLeave = useCallback(() => setCurrentState("default"), [])
  const handleMouseDown = useCallback(() => setCurrentState("active"), [])
  const handleMouseUp = useCallback(() => setCurrentState("hover"), [])

  const colors = stateColors[currentState]

  return (
    <div
      className="es-interaction-designer__preview-area"
      style={{
        backgroundColor: preview.bgHex,
        "--shadow-color": colors.shadowHsl,
        ...(colors.accentHsl ? { "--shadow-accent": colors.accentHsl } : {}),
      } as React.CSSProperties}
    >
      <span
        className="es-interaction-designer__preview-button"
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
      <span className="es-interaction-designer__preview-state-label">{currentState}</span>
    </div>
  )
}

/* ── Output formatting ───────────────────────────────────────────── */

function formatCssOutput(
  stateColors: Record<InteractionStateName, { shadowHsl: string; accentHsl: string | null }>,
  shadowStacks: Record<InteractionStateName, string>,
): string {
  const lines: string[] = []
  for (const name of STATE_NAMES) {
    const { shadowHsl, accentHsl } = stateColors[name]
    lines.push(`/* ${name} */`)
    lines.push(`--shadow-color-${name}: ${shadowHsl};`)
    if (accentHsl) {
      lines.push(`--shadow-accent-${name}: ${accentHsl};`)
    }
    lines.push(`--shadow-interaction-${name}:`)
    lines.push(`    ${shadowStacks[name]};`)
  }
  return lines.join("\n")
}

function formatTokenJson(
  stateColors: Record<InteractionStateName, { shadowHsl: string; accentHsl: string | null }>,
  state: DesignerState,
): string {
  const stateTokens: Record<string, object> = {}
  for (const name of STATE_NAMES) {
    const cfg = state.states[name]
    const { shadowHsl, accentHsl } = stateColors[name]
    stateTokens[name] = {
      depth: { $type: "number", $value: cfg.depth },
      engine: {
        intensity: { $type: "number", $value: cfg.intensity },
        hardness: { $type: "number", $value: cfg.hardness },
      },
      color: {
        hsl: { $type: "string", $value: shadowHsl },
        ...(accentHsl ? { accent_hsl: { $type: "string", $value: accentHsl } } : {}),
      },
    }
  }

  const output = {
    interaction_shadow: {
      shadow: {
        light: {
          x: { $type: "number", $value: state.lightX },
          y: { $type: "number", $value: state.lightY },
        },
      },
      resolution: { $type: "number", $value: state.layerCount },
      states: stateTokens,
    },
  }

  return JSON.stringify(output, null, 2)
}

/* ── Main component ──────────────────────────────────────────────── */

export function ShadowInteractionDesigner() {
  const [state, setState] = useState<DesignerState>(DEFAULT_STATE)

  /* ── State panel handlers ──────────────────────────────────────── */
  const handleSliderChange = useCallback((stateName: InteractionStateName, key: "intensity" | "hardness" | "depth", value: number) => {
    setState((prev) => ({
      ...prev,
      states: {
        ...prev.states,
        [stateName]: { ...prev.states[stateName], [key]: value },
      },
    }))
  }, [])

  const handleStateShadowColorChange = useCallback((stateName: InteractionStateName, hex: string) => {
    setState((prev) => ({
      ...prev,
      states: {
        ...prev.states,
        [stateName]: { ...prev.states[stateName], shadowColorHex: hex },
      },
    }))
  }, [])

  const handleStateAccentColorChange = useCallback((stateName: InteractionStateName, hex: string | null) => {
    setState((prev) => ({
      ...prev,
      states: {
        ...prev.states,
        [stateName]: { ...prev.states[stateName], accentColorHex: hex },
      },
    }))
  }, [])

  /* ── Global handlers ───────────────────────────────────────────── */
  const handleLightChange = useCallback((key: "lightX" | "lightY", value: number) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleLayerCountChange = useCallback((value: LayerCount) => {
    setState((prev) => ({ ...prev, layerCount: value }))
  }, [])

  const handlePreviewChange = useCallback((key: keyof PreviewConfig, hex: string) => {
    setState((prev) => ({ ...prev, preview: { ...prev.preview, [key]: hex } }))
  }, [])

  const handleReset = useCallback(() => {
    setState(DEFAULT_STATE)
  }, [])

  /* ── Derived values ────────────────────────────────────────────── */
  const stateColors = useMemo(() => {
    const colors = {} as Record<InteractionStateName, { shadowHsl: string; accentHsl: string | null }>
    for (const name of STATE_NAMES) {
      const cfg = state.states[name]
      colors[name] = {
        shadowHsl: resolveHsl(cfg.shadowColorHex),
        accentHsl: cfg.accentColorHex ? resolveHsl(cfg.accentColorHex) : null,
      }
    }
    return colors
  }, [state.states])

  // All states share the same layerCount, so CSS box-shadow transitions interpolate smoothly.
  const shadowStacks = useMemo(() => {
    const stacks = {} as Record<InteractionStateName, string>
    for (const name of STATE_NAMES) {
      const cfg = state.states[name]
      stacks[name] = buildShadowStack({
        depth: cfg.depth,
        lightX: state.lightX,
        lightY: state.lightY,
        intensity: cfg.intensity,
        hardness: cfg.hardness,
        resolution: 0,
        layerCount: state.layerCount,
      })
    }
    return stacks
  }, [state.states, state.lightX, state.lightY, state.layerCount])

  const cssOutput = useMemo(() => formatCssOutput(stateColors, shadowStacks), [stateColors, shadowStacks])
  const jsonOutput = useMemo(() => formatTokenJson(stateColors, state), [stateColors, state])

  return (
    <div className="es-interaction-designer">
      {/* Header */}
      <div className="es-interaction-designer__header">
        <h2 className="es-title es-title--lg">Shadow Interaction Designer</h2>
        <Button emphasis="low" size="sm" onClick={handleReset}>
          Reset Defaults
        </Button>
      </div>

      {/* Interactive Preview */}
      <InteractivePreview
        shadowStacks={shadowStacks}
        stateColors={stateColors}
        preview={state.preview}
      />

      {/* Controls: 3 state panels + global */}
      <div className="es-interaction-designer__controls">
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
  )
}
