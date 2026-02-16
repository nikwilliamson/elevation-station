import { useCallback, useMemo, useState } from "react"

import { GlobalControls } from "../globalControls/GlobalControls"
import { OutputSection } from "../outputSection/OutputSection"
import { ShadowPreview } from "../shadowPreview/ShadowPreview"
import { StatePanel } from "../statePanel/StatePanel"
// @ts-expect-error -- JS engine module
import { buildShadowStack as _buildShadowStack } from "../../engine/shadowElevationEngine.js"
import { resolveHsl } from "../../shared/colorPalette"
import { Button } from "../button/Button"

import "./shadowInteractionDesigner.css"

const buildShadowStack = _buildShadowStack as (params: { depth: number; lightX: number; lightY: number; intensity: number; hardness: number; resolution: number; layerCount?: number }) => string

/* ── Types ─────────────────────────────────────────────────────── */

interface InteractionStateConfig {
  intensity: number
  hardness: number
  depth: number
  shadowColorHex: string
  accentColorHex: string | null
  componentBgHex: string
  componentTextHex: string
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
  enabledStates: Record<InteractionStateName, boolean>
  preview: PreviewConfig
}

/* ── Defaults ────────────────────────────────────────────────────── */

const DEFAULT_SHADOW_COLOR = "#9636df"

const DEFAULT_STATE: DesignerState = {
  lightX: 0.35,
  lightY: 1.0,
  layerCount: 5,
  states: {
    default: { depth: 0.25, intensity: 0.25, hardness: 0.25, shadowColorHex: DEFAULT_SHADOW_COLOR, accentColorHex: null, componentBgHex: "#C850C0", componentTextHex: "#ffffff" },
    hover: { depth: 0.40, intensity: 0.35, hardness: 0.20, shadowColorHex: DEFAULT_SHADOW_COLOR, accentColorHex: null, componentBgHex: "#C850C0", componentTextHex: "#ffffff" },
    active: { depth: 0.10, intensity: 0.15, hardness: 0.40, shadowColorHex: DEFAULT_SHADOW_COLOR, accentColorHex: null, componentBgHex: "#C850C0", componentTextHex: "#ffffff" },
  },
  enabledStates: {
    default: true,
    hover: true,
    active: true,
  },
  preview: {
    bgHex: "#ffffff",
    componentBgHex: "#C850C0",
    componentTextHex: "#ffffff",
  },
}

const STATE_NAMES: InteractionStateName[] = ["default", "hover", "active"]

/* ── Output formatting ───────────────────────────────────────────── */

function formatCssOutput(
  stateColors: Record<InteractionStateName, { shadowHsl: string; accentHsl: string | null }>,
  shadowStacks: Record<InteractionStateName, string>,
  enabledStates: Record<InteractionStateName, boolean>,
): string {
  const lines: string[] = []
  for (const name of STATE_NAMES) {
    if (!enabledStates[name]) continue
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
    if (!state.enabledStates[name]) continue
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

  const handleStateEnabledChange = useCallback((stateName: InteractionStateName, enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      enabledStates: { ...prev.enabledStates, [stateName]: enabled },
    }))
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

  const cssOutput = useMemo(() => formatCssOutput(stateColors, shadowStacks, state.enabledStates), [stateColors, shadowStacks, state.enabledStates])
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
      <ShadowPreview
        variant="button"
        className="es-shadow-preview--panel"
        bgHex={state.preview.bgHex}
        surfaceHex={state.preview.bgHex}
        shadowStack="none"
        interactiveShadowStacks={shadowStacks}
        interactiveColorHsls={Object.fromEntries(
          STATE_NAMES.map((s) => [s, { shadow: stateColors[s].shadowHsl, accent: stateColors[s].accentHsl }]),
        ) as Record<InteractionStateName, { shadow: string; accent: string | null }>}
        componentBgHex={Object.fromEntries(
          STATE_NAMES.map((s) => [s, state.states[s].componentBgHex]),
        ) as Record<InteractionStateName, string>}
        componentTextHex={Object.fromEntries(
          STATE_NAMES.map((s) => [s, state.states[s].componentTextHex]),
        ) as Record<InteractionStateName, string>}
        enabledStates={state.enabledStates}
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
            enabled={state.enabledStates[name]}
            onEnabledChange={name !== "default" ? (enabled) => handleStateEnabledChange(name, enabled) : undefined}
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
