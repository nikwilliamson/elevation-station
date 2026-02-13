import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { motion, useMotionValue, useSpring, useTransform } from "motion/react"

import { BezierCurveEditor } from "./BezierCurveEditor"
import { ControlSlider } from "./ControlSlider"
import { ElevationPreview, type PreviewLayout } from "./ElevationPreview"
import { HighlightedCode } from "./HighlightedCode"
import { Sidebar } from "./Sidebar"
import { TabSelect } from "./TabSelect"
// @ts-expect-error -- JS engine module
import { buildShadowStack as _buildShadowStack } from "../engine/shadowElevationEngine.js"
import { COLOR_HSL_MAP, hexToHsl, type ColorFormat } from "../shared/colorPalette"
import { ColorFormatContext } from "../shared/ColorFormatContext"
import type { CurvePoint } from "../shared/curvePresets"
import { DEFAULTS, type EngineParams, type PreviewConfig, type ShadowCurves, type PaletteState } from "../shared/defaults"
import { ColorPicker } from "./ColorPicker"
import { FieldLabel } from "./FieldLabel"
import { Button, type ButtonState } from "./Button"

import "./outputSection.css"
import "./shadowTokenDesigner.css"

const buildShadowStack = _buildShadowStack as (params: { depth: number; lightX: number; lightY: number; intensity: number; hardness: number; resolution: number; layerCount?: number; curves?: ShadowCurves }) => string

/* ── Slider config ─────────────────────────────────────────────── */

interface SliderConfig {
  label: string
  description: string
  key: keyof EngineParams
  min: number
  max: number
  step: number
}

const ENGINE_SLIDERS: SliderConfig[] = [
  { label: "Intensity", description: "Overall shadow intensity and darkness", key: "intensity", min: 0, max: 1, step: 0.01 },
  { label: "Hardness", description: "Edge sharpness from soft to hard", key: "hardness", min: 0, max: 1, step: 0.01 },
  { label: "Resolution", description: "Number of layers in the shadow stack", key: "resolution", min: 0, max: 1, step: 0.01 },
]

/* ── LightPositionPad ────────────────────────────────────────────── */

interface LightPositionPadProps {
  lightX: number
  lightY: number
  onChangeX: (value: number) => void
  onChangeY: (value: number) => void
}

/** Spring configs for the light position pad */
const LIGHT_SPRING = { stiffness: 400, damping: 35, restDelta: 0.001 }
const SUN_SCALE_SPRING = { stiffness: 500, damping: 25 }

function LightPositionPad({ lightX, lightY, onChangeX, onChangeY }: LightPositionPadProps) {
  const padRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  // Motion values -> springs for smooth sun position
  const rawX = useMotionValue(lightX)
  const rawY = useMotionValue(lightY)
  const springX = useSpring(rawX, LIGHT_SPRING)
  const springY = useSpring(rawY, LIGHT_SPRING)

  // Map light coords (-1...1) -> percentage offsets from center
  const x = useTransform(springX, (v) => `${((-v + 1) / 2) * 100}%`)
  const y = useTransform(springY, (v) => `${((-v + 1) / 2) * 100}%`)

  // Scale spring: grows when grabbed
  const sunScale = useSpring(1, SUN_SCALE_SPRING)

  // Sync incoming prop changes (Reset, external) -> spring to new position
  useEffect(() => {
    if (!dragging) {
      rawX.set(lightX)
      rawY.set(lightY)
    }
  }, [lightX, lightY, dragging, rawX, rawY])

  const updateFromPointer = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      const pad = padRef.current
      if (!pad) return
      const rect = pad.getBoundingClientRect()
      // Pad shows light position; engine uses shadow direction — invert both axes
      const nx = Math.max(-1, Math.min(1, -(((e.clientX - rect.left) / rect.width) * 2 - 1)))
      const ny = Math.max(-1, Math.min(1, -(((e.clientY - rect.top) / rect.height) * 2 - 1)))
      const rx = Math.round(nx * 100) / 100
      const ry = Math.round(ny * 100) / 100
      rawX.set(rx)
      rawY.set(ry)
      onChangeX(rx)
      onChangeY(ry)
    },
    [onChangeX, onChangeY, rawX, rawY],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      ;(e.target as Element).setPointerCapture(e.pointerId)
      setDragging(true)
      sunScale.set(1.4)
      updateFromPointer(e)
    },
    [updateFromPointer, sunScale],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return
      updateFromPointer(e)
    },
    [dragging, updateFromPointer],
  )

  const handlePointerUp = useCallback(() => {
    setDragging(false)
    sunScale.set(1)
  }, [sunScale])

  return (
    <div className="es-shadow-token-designer__light-pad-wrapper">
      <div ref={padRef} className="es-shadow-token-designer__light-pad" style={{ cursor: dragging ? "grabbing" : "crosshair" }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        {/* Sun indicator — spring-animated position + scale */}
        <motion.div className="es-shadow-token-designer__light-pad-sun" data-active={dragging || undefined} style={{ left: x, top: y, scale: sunScale }} />
      </div>
      <div className="es-bezier-editor__coords">
        <span className="es-bezier-editor__coord">x: {lightX.toFixed(2)}</span>
        <span className="es-bezier-editor__coord">y: {lightY.toFixed(2)}</span>
      </div>
    </div>
  )
}

/* ── EngineControls ──────────────────────────────────────────────── */

interface EngineControlsProps {
  engine: EngineParams
  onEngineChange: (key: keyof EngineParams, value: number) => void
}

/* ── ColorControls ───────────────────────────────────────────────── */

interface ColorControlsProps {
  colorFormat: ColorFormat
  onColorFormatChange: (format: ColorFormat) => void
  shadowColorHex: string
  accentColorHex: string | null
  onColorChange: (hex: string) => void
  onAccentColorChange: (hex: string | null) => void
}

const COLOR_FORMATS: { label: string; value: ColorFormat }[] = [
  { label: "OKLCH", value: "oklch" },
  { label: "LCH", value: "lch" },
  { label: "RGB", value: "rgb" },
  { label: "Hex", value: "hex" },
]

function ColorControls({ colorFormat, onColorFormatChange, shadowColorHex, accentColorHex, onColorChange, onAccentColorChange }: ColorControlsProps) {
  return (
    <div className="es-shadow-token-designer__panel">
      <div className="es-shadow-token-designer__slider-group">
        <FieldLabel label="Color Format" description="Output format for color values" size="sm" />
        <TabSelect options={COLOR_FORMATS} value={colorFormat} onChange={onColorFormatChange} layoutId="color-format-tabs" />
      </div>
      <div className="es-shadow-token-designer__slider-group">
        <ColorPicker label="Shadow Color" description="Base color for tight contact layers" labelSize="sm" value={shadowColorHex} onChange={onColorChange} />
      </div>
      <div className="es-shadow-token-designer__slider-group">
        <ColorPicker
          label="Accent Color (glow)"
          description="Color for outer atmospheric layers"
          labelSize="sm"
          value={accentColorHex ?? shadowColorHex}
          onChange={(hex) => onAccentColorChange(hex)}
          disabled={!accentColorHex}
          toggle={accentColorHex ? "on" : "off"}
          onToggleChange={(v) => onAccentColorChange(v === "on" ? shadowColorHex : null)}
        />
      </div>
    </div>
  )
}

/* ── CurveControls ───────────────────────────────────────────────── */

interface CurveControlsProps {
  curves: ShadowCurves
  onCurveChange: (key: keyof ShadowCurves, points: CurvePoint[]) => void
}

const CURVE_EDITORS: { label: string; description: string; key: keyof ShadowCurves; color: string }[] = [
  { label: "Layer Distribution", description: "How shadow layers are spaced from contact to edge", key: "layerDistribution", color: "#126bf9" },
  { label: "Offset Growth", description: "How offset scales with depth elevation", key: "offsetGrowth", color: "#126bf9" },
  { label: "Alpha Distribution", description: "How opacity is shaped across layers", key: "alphaDistribution", color: "#9636df" },
]

interface ControlsGridProps extends CurveControlsProps, EngineControlsProps, ColorControlsProps {}

function ControlsGrid({ curves, onCurveChange, engine, onEngineChange, colorFormat, onColorFormatChange, shadowColorHex, accentColorHex, onColorChange, onAccentColorChange }: ControlsGridProps) {
  const handlers = useMemo(() => Object.fromEntries(CURVE_EDITORS.map(({ key }) => [key, (points: CurvePoint[]) => onCurveChange(key, points)])) as Record<keyof ShadowCurves, (points: CurvePoint[]) => void>, [onCurveChange])

  return (
    <div className="es-shadow-token-designer__controls-grid">
      <div className="es-shadow-token-designer__controls-grid-cell">
        <FieldLabel label="Shadow Engine" description="Core parameters that shape the shadow output" />
        <EngineControls engine={engine} onEngineChange={onEngineChange} />
      </div>
      {/* Light position */}
      <div className="es-shadow-token-designer__controls-grid-cell">
        <FieldLabel label="Light Position" description="Where the light source is relative to the surface" />
        <LightPositionPad lightX={engine.lightX} lightY={engine.lightY} onChangeX={(v) => onEngineChange("lightX", v)} onChangeY={(v) => onEngineChange("lightY", v)} />
      </div>
      {/* Color controls */}
      <div className="es-shadow-token-designer__controls-grid-cell">
        <FieldLabel label="Color" description="Shadow and accent color configuration" />
        <ColorControls colorFormat={colorFormat} onColorFormatChange={onColorFormatChange} shadowColorHex={shadowColorHex} accentColorHex={accentColorHex} onColorChange={onColorChange} onAccentColorChange={onAccentColorChange} />
      </div>

      {/* Curve editors */}
      {CURVE_EDITORS.map(({ label, description, key, color }) => (
        <div key={key} className="es-shadow-token-designer__controls-grid-cell">
          <FieldLabel label={label} description={description} />
          <BezierCurveEditor points={curves[key] ?? []} onChange={handlers[key]} color={color} />
        </div>
      ))}
    </div>
  )
}

function EngineControls({ engine, onEngineChange }: EngineControlsProps) {
  return (
    <div className="es-shadow-token-designer__panel">
      {ENGINE_SLIDERS.map((slider) => (
        <ControlSlider key={slider.key} label={slider.label} description={slider.description} size="sm" value={engine[slider.key]} min={slider.min} max={slider.max} step={slider.step} onChange={(v) => onEngineChange(slider.key, v)} />
      ))}
    </div>
  )
}

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

function formatCssOutput(shadowColorHsl: string, accentColorHsl: string | null, state: PaletteState, shadowStacks: string[]): string {
  const lines: string[] = [`--shadow-color: ${shadowColorHsl};`]
  if (accentColorHsl) {
    lines.push(`--shadow-accent: ${accentColorHsl};`)
  }
  state.elevations.forEach((level, i) => {
    const safeName = sanitiseCssName(level.name)
    lines.push(`--z-index-${safeName}: ${level.zIndex};`)
    lines.push(`--shadow-elevation-${safeName}:`)
    lines.push(`    ${shadowStacks[i]};`)
  })
  return lines.join("\n")
}

function formatTokenJson(shadowColorHsl: string, state: PaletteState): string {
  const engineTokens: Record<string, { $type: string; $value: number }> = {}
  for (const key of Object.keys(state.engine) as (keyof EngineParams)[]) {
    engineTokens[key] = { $type: "number", $value: state.engine[key] }
  }

  const elevationTokens: Record<string, { depth: { $type: string; $value: number }; zIndex: { $type: string; $value: number } }> = {}
  for (const level of state.elevations) {
    elevationTokens[level.name] = {
      depth: { $type: "number", $value: level.depth },
      zIndex: { $type: "number", $value: level.zIndex },
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
  const [copyState, setCopyState] = useState<ButtonState>("idle")
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

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
      return { ...prev, elevations: [...prev.elevations, { name: newName, depth: newDepth, zIndex: newZIndex }] }
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
          resolution: state.engine.resolution,
          curves: state.curves,
        }),
      ),
    [state.engine, state.elevations, state.curves],
  )

  const cssOutput = useMemo(() => formatCssOutput(shadowColorHsl, accentColorHsl, state, shadowStacks), [shadowColorHsl, accentColorHsl, state, shadowStacks])
  const jsonOutput = useMemo(() => formatTokenJson(shadowColorHsl, state), [shadowColorHsl, state])

  return (
    <ColorFormatContext.Provider value={colorFormat}>
    <div className="es-shadow-token-designer" style={{ "--shadow-color": shadowColorHsl, ...(accentColorHsl ? { "--shadow-accent": accentColorHsl } : {}) } as React.CSSProperties}>
      {/* Main content area */}
      <div className="es-shadow-token-designer__main">
        {/* Header */}
        <div className="es-shadow-token-designer__header">
          <h2 className="es-title es-title--lg">Shadow Palette Generator</h2>
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
        />

      </div>

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
                layout={previewLayout}
                onLayoutChange={setPreviewLayout}
                onPreviewChange={handlePreviewChange}
                onNameChange={handleNameChange}
                onDepthChange={handleDepthChange}
                onZIndexChange={handleZIndexChange}
                onRemoveElevation={handleRemoveElevation}
              />
            ),
          },
          {
            label: "CSS Variables",
            value: "css" as SidebarTabValue,
            title: "CSS Variables",
            control: (
              <Button
                emphasis="high"
                size="sm"
                state={copyState}
                stateLabels={{ idle: "Copy", success: "Copied!", error: "Failed" }}
                onClick={() => {
                  clearTimeout(copyTimeoutRef.current)
                  void navigator.clipboard.writeText(cssOutput).then(
                    () => {
                      setCopyState("success")
                      copyTimeoutRef.current = setTimeout(() => setCopyState("idle"), 2000)
                    },
                    () => {
                      setCopyState("error")
                      copyTimeoutRef.current = setTimeout(() => setCopyState("idle"), 2000)
                    }
                  )
                }}
              />
            ),
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
            control: (
              <Button
                emphasis="high"
                size="sm"
                state={copyState}
                stateLabels={{ idle: "Copy", success: "Copied!", error: "Failed" }}
                onClick={() => {
                  clearTimeout(copyTimeoutRef.current)
                  void navigator.clipboard.writeText(jsonOutput).then(
                    () => {
                      setCopyState("success")
                      copyTimeoutRef.current = setTimeout(() => setCopyState("idle"), 2000)
                    },
                    () => {
                      setCopyState("error")
                      copyTimeoutRef.current = setTimeout(() => setCopyState("idle"), 2000)
                    }
                  )
                }}
              />
            ),
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
