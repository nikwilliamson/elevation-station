import React, { useCallback, useMemo, useRef, useState } from "react"

import { ControlsGrid } from "../controlsGrid/ControlsGrid"
import { ElevationPreview, type PreviewLayout } from "../elevationPreview/ElevationPreview"
import { HighlightedCode } from "../highlightedCode/HighlightedCode"
import { Sidebar } from "../sidebar/Sidebar"
// @ts-expect-error -- JS engine module
import { buildShadowStack as _buildShadowStack } from "../../engine/shadowElevationEngine.js"
import { COLOR_HSL_MAP, hexToHsl, type ColorFormat } from "../../shared/colorPalette"
import { ColorFormatContext } from "../../shared/ColorFormatContext"
import type { CurvePoint } from "../../shared/curvePresets"
import { DEFAULTS, type EngineParams, type PreviewConfig, type ShadowCurves, type PaletteState, type ElevationType, type InteractionStateName, type InteractionStateConfig, type LayerCount, createDefaultInteractionStates } from "../../shared/defaults"
import { Button } from "../button/Button"
import { CopyButton } from "../copyButton/CopyButton"
import { ResizeHandle } from "../resizeHandle/ResizeHandle"

import "../outputSection/outputSection.css"
import "./shadowTokenDesigner.css"

const buildShadowStack = _buildShadowStack as (params: { depth: number; lightX: number; lightY: number; intensity: number; hardness: number; resolution: number; layerCount?: number; curves?: ShadowCurves }) => string

/* ── Output formatting ───────────────────────────────────────────── */

/** Sanitise a user-entered name into a valid CSS custom-property fragment. */
function sanitiseCssName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "") || "unnamed"
}

function formatCssOutput(
  shadowColorHsl: string,
  accentColorHsl: string | null,
  state: PaletteState,
  shadowStacks: string[],
  interactiveShadowStacks: Record<number, Record<InteractionStateName, string>>,
  interactiveColorHsls: Record<number, Record<InteractionStateName, { shadow: string; accent: string | null }>>,
): string {
  const indent = "  "
  const valueIndent = `${indent}    `
  const reindentStack = (stack: string) => stack.replace(/\n\s*/g, `\n${valueIndent}`)
  const lines: string[] = [`${indent}--shadow-color: ${shadowColorHsl};`]
  if (accentColorHsl) {
    lines.push(`${indent}--shadow-accent: ${accentColorHsl};`)
  }
  state.elevations.forEach((level, i) => {
    const safeName = sanitiseCssName(level.name)
    lines.push(`${indent}--z-index-${safeName}: ${level.zIndex};`)
    if (level.type === "interactive" && interactiveShadowStacks[i]) {
      const stateStacks = interactiveShadowStacks[i]
      const stateColors = interactiveColorHsls[i]
      for (const stateName of ["default", "hover", "active"] as InteractionStateName[]) {
        if (level.enabledStates?.[stateName] === false) continue
        if (stateColors?.[stateName]) {
          const sc = stateColors[stateName]
          if (sc.shadow !== shadowColorHsl) {
            lines.push(`${indent}--shadow-color-${safeName}-${stateName}: ${sc.shadow};`)
          }
          if (sc.accent && sc.accent !== accentColorHsl) {
            lines.push(`${indent}--shadow-accent-${safeName}-${stateName}: ${sc.accent};`)
          }
        }
        lines.push(`${indent}--shadow-elevation-${safeName}-${stateName}:`)
        lines.push(`${valueIndent}${reindentStack(stateStacks[stateName])};`)
      }
    } else {
      lines.push(`${indent}--shadow-elevation-${safeName}:`)
      lines.push(`${valueIndent}${reindentStack(shadowStacks[i])};`)
    }
  })
  return `:root {\n${lines.join("\n")}\n}`
}

function formatTokenJson(shadowColorHsl: string, state: PaletteState): string {
  const engineTokens: Record<string, { $type: string; $value: number }> = {}
  for (const key of Object.keys(state.engine) as (keyof EngineParams)[]) {
    engineTokens[key] = { $type: "number", $value: state.engine[key] }
  }

  const elevationTokens: Record<string, Record<string, unknown>> = {}
  for (const level of state.elevations) {
    if (level.type === "interactive" && level.interactionStates) {
      const states: Record<string, Record<string, { $type: string; $value: number | string | null }>> = {}
      for (const [stateName, cfg] of Object.entries(level.interactionStates)) {
        if (level.enabledStates?.[stateName as InteractionStateName] === false) continue
        states[stateName] = {
          depth: { $type: "number", $value: cfg.depth },
          intensity: { $type: "number", $value: cfg.intensity },
          hardness: { $type: "number", $value: cfg.hardness },
          shadowColorHex: { $type: "string", $value: cfg.shadowColorHex },
          accentColorHex: { $type: "string", $value: cfg.accentColorHex },
        }
      }
      elevationTokens[level.name] = {
        type: { $type: "string", $value: "interactive" },
        zIndex: { $type: "number", $value: level.zIndex },
        states,
      }
    } else {
      elevationTokens[level.name] = {
        depth: { $type: "number", $value: level.depth },
        zIndex: { $type: "number", $value: level.zIndex },
      }
    }
  }

  const output = {
    elevation_new: {
      shadow: {
        engine: engineTokens,
        color: {
          hsl: { $type: "string", $value: shadowColorHsl },
        },
      },
      elevation: elevationTokens,
    },
  }

  return JSON.stringify(output, null, 2)
}

/* ── Main component ──────────────────────────────────────────────── */

type SidebarTabValue = "preview" | "css" | "json"

export function ShadowTokenDesigner() {
  const [state, setState] = useState<PaletteState>(DEFAULTS)
  const [colorFormat, setColorFormat] = useState<ColorFormat>(DEFAULTS.colorFormat)
  const [sidebarTab, setSidebarTab] = useState<SidebarTabValue>("preview")
  const [previewLayout, setPreviewLayout] = useState<PreviewLayout>(DEFAULTS.previewLayout)
  const gridRef = useRef<HTMLDivElement>(null)

  const handleEngineChange = useCallback((key: keyof EngineParams, value: number) => {
    setState((prev) => ({ ...prev, engine: { ...prev.engine, [key]: value } }))
  }, [])

  const handleColorChange = useCallback((hex: string) => {
    setState((prev) => ({ ...prev, shadowColorHex: hex }))
  }, [])

  const handleAccentColorChange = useCallback((hex: string | null) => {
    setState((prev) => ({ ...prev, accentColorHex: hex }))
  }, [])

  const handlePreviewChange = useCallback((key: keyof PreviewConfig, hex: string) => {
    setState((prev) => ({ ...prev, preview: { ...prev.preview, [key]: hex } }))
  }, [])

  const handleDepthChange = useCallback((index: number, depth: number) => {
    setState((prev) => ({
      ...prev,
      elevations: prev.elevations.map((el, i) => (i === index ? { ...el, depth } : el)),
    }))
  }, [])

  const handleZIndexChange = useCallback((index: number, zIndex: number) => {
    setState((prev) => ({
      ...prev,
      elevations: prev.elevations.map((el, i) => (i === index ? { ...el, zIndex } : el)),
    }))
  }, [])

  const handleReset = useCallback(() => {
    setState(DEFAULTS)
  }, [])

  const handleAddElevation = useCallback(() => {
    setState((prev) => {
      const last = prev.elevations[prev.elevations.length - 1]
      const newDepth = Math.min(1, (last?.depth ?? 0.5) + 0.1)
      const newZIndex = (last?.zIndex ?? 0) + 1
      const newName = `custom-${prev.elevations.length + 1}`
      return { ...prev, elevations: [...prev.elevations, { name: newName, depth: newDepth, zIndex: newZIndex, type: "static" as const }] }
    })
  }, [])

  const handleNameChange = useCallback((index: number, name: string) => {
    setState((prev) => ({
      ...prev,
      elevations: prev.elevations.map((el, i) => (i === index ? { ...el, name } : el)),
    }))
  }, [])

  const handleRemoveElevation = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      elevations: prev.elevations.filter((_, i) => i !== index),
    }))
  }, [])

  const handleCurveChange = useCallback((key: keyof ShadowCurves, points: CurvePoint[]) => {
    setState((prev) => ({ ...prev, curves: { ...prev.curves, [key]: points } }))
  }, [])

  const handleTypeChange = useCallback((index: number, type: ElevationType) => {
    setState((prev) => ({
      ...prev,
      elevations: prev.elevations.map((el, i) => {
        if (i !== index) return el
        if (type === "interactive" && !el.interactionStates) {
          return {
            ...el,
            type,
            enabledStates: { default: true, hover: true, active: true },
            interactionStates: createDefaultInteractionStates(
              el.depth,
              prev.engine.intensity,
              prev.engine.hardness,
              prev.shadowColorHex,
              prev.accentColorHex,
              prev.preview.surfaceHex,
            ),
          }
        }
        return { ...el, type }
      }),
    }))
  }, [])

  const handleLayerCountChange = useCallback((index: number, layerCount: LayerCount | undefined) => {
    setState((prev) => ({
      ...prev,
      elevations: prev.elevations.map((el, i) => (i === index ? { ...el, layerCount } : el)),
    }))
  }, [])

  const handleInteractionStateEnabledChange = useCallback(
    (index: number, stateName: InteractionStateName, enabled: boolean) => {
      setState((prev) => ({
        ...prev,
        elevations: prev.elevations.map((el, i) => {
          if (i !== index) return el
          const prev = el.enabledStates ?? { default: true, hover: true, active: true }
          return {
            ...el,
            enabledStates: { ...prev, [stateName]: enabled },
          }
        }),
      }))
    },
    [],
  )

  const handleInteractionStateChange = useCallback(
    (index: number, stateName: InteractionStateName, key: keyof InteractionStateConfig, value: number | string | null) => {
      setState((prev) => ({
        ...prev,
        elevations: prev.elevations.map((el, i) => {
          if (i !== index || !el.interactionStates) return el
          return {
            ...el,
            interactionStates: {
              ...el.interactionStates,
              [stateName]: { ...el.interactionStates[stateName], [key]: value },
            },
          }
        }),
      }))
    },
    [],
  )

  // Derive HSL from selected hex
  const shadowColorHsl = useMemo(() => COLOR_HSL_MAP.get(state.shadowColorHex) ?? hexToHsl(state.shadowColorHex), [state.shadowColorHex])
  const accentColorHsl = useMemo(() => (state.accentColorHex ? (COLOR_HSL_MAP.get(state.accentColorHex) ?? hexToHsl(state.accentColorHex)) : null), [state.accentColorHex])

  // Derive shadow stacks from engine params + elevation depths + curves
  const shadowStacks = useMemo(
    () =>
      state.elevations.map((level): string =>
        buildShadowStack({
          depth: level.depth,
          lightX: state.engine.lightX,
          lightY: state.engine.lightY,
          intensity: state.engine.intensity,
          hardness: state.engine.hardness,
          resolution: 0,
          layerCount: level.layerCount ?? state.engine.layerCount,
          curves: state.curves,
        }),
      ),
    [state.engine, state.elevations, state.curves],
  )

  // Derive per-state shadow stacks for interactive elevations
  const interactiveShadowStacks = useMemo(() => {
    const result: Record<number, Record<InteractionStateName, string>> = {}
    state.elevations.forEach((level, i) => {
      if (level.type === "interactive" && level.interactionStates) {
        const stateStacks = {} as Record<InteractionStateName, string>
        for (const stateName of ["default", "hover", "active"] as InteractionStateName[]) {
          const cfg = level.interactionStates[stateName]
          stateStacks[stateName] = buildShadowStack({
            depth: cfg.depth,
            lightX: state.engine.lightX,
            lightY: state.engine.lightY,
            intensity: cfg.intensity,
            hardness: cfg.hardness,
            resolution: 0,
            layerCount: level.layerCount ?? state.engine.layerCount,
            curves: state.curves,
          })
        }
        result[i] = stateStacks
      }
    })
    return result
  }, [state.engine, state.elevations, state.curves])

  // Derive per-state HSL colors for interactive elevations
  const interactiveColorHsls = useMemo(() => {
    const result: Record<number, Record<InteractionStateName, { shadow: string; accent: string | null }>> = {}
    state.elevations.forEach((level, i) => {
      if (level.type === "interactive" && level.interactionStates) {
        const stateColors = {} as Record<InteractionStateName, { shadow: string; accent: string | null }>
        for (const stateName of ["default", "hover", "active"] as InteractionStateName[]) {
          const cfg = level.interactionStates[stateName]
          stateColors[stateName] = {
            shadow: COLOR_HSL_MAP.get(cfg.shadowColorHex) ?? hexToHsl(cfg.shadowColorHex),
            accent: cfg.accentColorHex ? (COLOR_HSL_MAP.get(cfg.accentColorHex) ?? hexToHsl(cfg.accentColorHex)) : null,
          }
        }
        result[i] = stateColors
      }
    })
    return result
  }, [state.elevations])

  const cssOutput = useMemo(() => formatCssOutput(shadowColorHsl, accentColorHsl, state, shadowStacks, interactiveShadowStacks, interactiveColorHsls), [shadowColorHsl, accentColorHsl, state, shadowStacks, interactiveShadowStacks, interactiveColorHsls])
  const jsonOutput = useMemo(() => formatTokenJson(shadowColorHsl, state), [shadowColorHsl, state])

  return (
    <ColorFormatContext.Provider value={colorFormat}>
    <div
      ref={gridRef}
      className="es-shadow-token-designer"
      style={{ "--shadow-color": shadowColorHsl, ...(accentColorHsl ? { "--shadow-accent": accentColorHsl } : {}) } as React.CSSProperties}
    >
      {/* Main content area */}
      <div className="es-shadow-token-designer__main">
        {/* Header */}
        <div className="es-shadow-token-designer__header">
          <h1 className="es-title es-title--lg">Shadow Palette Generator</h1>
          <Button emphasis="low" size="sm" onClick={handleReset}>
            Reset Defaults
          </Button>
        </div>

        {/* Controls grid: light pad, engine sliders, color, and 3 curve editors */}
        <ControlsGrid
          curves={state.curves}
          onCurveChange={handleCurveChange}
          engine={state.engine}
          onEngineChange={handleEngineChange}
          colorFormat={colorFormat}
          onColorFormatChange={setColorFormat}
          shadowColorHex={state.shadowColorHex}
          accentColorHex={state.accentColorHex}
          onColorChange={handleColorChange}
          onAccentColorChange={handleAccentColorChange}
          elevationDepths={state.elevations.map((el) => el.depth)}
        />

      </div>

      {/* Resize handle */}
      <ResizeHandle containerRef={gridRef} />

      {/* Sidebar */}
      <Sidebar
        activeTab={sidebarTab}
        onTabChange={setSidebarTab}
        tabs={[
          {
            label: "Preview",
            value: "preview" as SidebarTabValue,
            title: "Preview",
            control: (
              <Button emphasis="high" size="sm" onClick={handleAddElevation}>
                + Add Elevation
              </Button>
            ),
            content: (
              <ElevationPreview
                preview={state.preview}
                elevations={state.elevations}
                shadowStacks={shadowStacks}
                interactiveShadowStacks={interactiveShadowStacks}
                interactiveColorHsls={interactiveColorHsls}
                shadowColorHsl={shadowColorHsl}
                accentColorHsl={accentColorHsl}
                layout={previewLayout}
                onLayoutChange={setPreviewLayout}
                onPreviewChange={handlePreviewChange}
                onNameChange={handleNameChange}
                onDepthChange={handleDepthChange}
                onZIndexChange={handleZIndexChange}
                onRemoveElevation={handleRemoveElevation}
                onTypeChange={handleTypeChange}
                onInteractionStateChange={handleInteractionStateChange}
                onInteractionStateEnabledChange={handleInteractionStateEnabledChange}
                onLayerCountChange={handleLayerCountChange}
              />
            ),
          },
          {
            label: "CSS Variables",
            value: "css" as SidebarTabValue,
            title: "CSS Variables",
            control: <CopyButton text={cssOutput} />,
            content: (
              <div className="es-output__code">
                <HighlightedCode code={cssOutput} lang="css" />
              </div>
            ),
          },
          {
            label: "Tokens",
            value: "json" as SidebarTabValue,
            title: "Token JSON",
            control: <CopyButton text={jsonOutput} />,
            content: (
              <div className="es-output__code">
                <HighlightedCode code={jsonOutput} lang="json" />
              </div>
            ),
          },
        ]}
      />
    </div>
    </ColorFormatContext.Provider>
  )
}
