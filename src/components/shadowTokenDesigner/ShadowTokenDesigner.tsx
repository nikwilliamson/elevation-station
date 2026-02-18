import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react"

import { ControlsGrid } from "../controlsGrid/ControlsGrid"
import { ElevationPreview, type PreviewLayout } from "../elevationPreview/ElevationPreview"
import { HighlightedCode } from "../highlightedCode/HighlightedCode"
import { Sidebar } from "../sidebar/Sidebar"
import { buildShadowStack, buildShadowLayers, type ShadowLayer } from "../../engine/shadowElevationEngine"
import { COLOR_HSL_MAP, hexToHsl, hexToDtcgColor, type ColorFormat } from "../../shared/colorPalette"
import { ColorFormatContext } from "../../shared/ColorFormatContext"
import { CURVE_PRESETS, resolvePreset, type CurvePoint } from "../../shared/curvePresets"
import { DEFAULTS, type EngineParams, type PreviewConfig, type ShadowCurves, type PaletteState, type ElevationType, type InteractionStateName, type InteractionStateConfig, type LayerCount, createDefaultInteractionStates } from "../../shared/defaults"
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string"
import { sanitiseCssName } from "../../shared/sanitiseCssName"
import { Button, type ButtonState } from "../button/Button"
import { CopyButton } from "../copyButton/CopyButton"
import { ResizeHandle } from "../resizeHandle/ResizeHandle"

import "./shadowTokenDesigner.css"

/* ── Output formatting ───────────────────────────────────────────── */

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

function buildDtcgShadowValue(
  layers: ShadowLayer[],
  shadowColorHex: string,
  accentColorHex: string | null,
  colorFormat: ColorFormat,
) {
  return layers.map((layer) => {
    const colorHex = layer.isAccent ? (accentColorHex ?? shadowColorHex) : shadowColorHex
    return {
      color: hexToDtcgColor(colorHex, layer.alpha, colorFormat),
      offsetX: { value: layer.offsetX, unit: "px" },
      offsetY: { value: layer.offsetY, unit: "px" },
      blur: { value: layer.blur, unit: "px" },
      spread: { value: layer.spread, unit: "px" },
    }
  })
}

function formatTokenJson(state: PaletteState, colorFormat: ColorFormat): string {
  const elevationTokens: Record<string, Record<string, unknown>> = {}

  for (const level of state.elevations) {
    if (level.type === "interactive" && level.interactionStates) {
      const states: Record<string, unknown> = {}
      for (const [stateName, cfg] of Object.entries(level.interactionStates)) {
        if (level.enabledStates?.[stateName as InteractionStateName] === false) continue
        const layers = buildShadowLayers({
          depth: cfg.depth,
          lightX: state.engine.lightX,
          lightY: state.engine.lightY,
          intensity: cfg.intensity,
          hardness: cfg.hardness,
          resolution: 0,
          layerCount: level.layerCount ?? state.engine.layerCount,
          curves: state.curves,
        })
        states[stateName] = {
          $type: "shadow",
          $value: buildDtcgShadowValue(layers, cfg.shadowColorHex, cfg.accentColorHex, colorFormat),
        }
      }
      elevationTokens[level.name] = {
        zIndex: { $type: "number", $value: level.zIndex },
        ...states,
      }
    } else {
      const layers = buildShadowLayers({
        depth: level.depth,
        lightX: state.engine.lightX,
        lightY: state.engine.lightY,
        intensity: state.engine.intensity,
        hardness: state.engine.hardness,
        resolution: 0,
        layerCount: level.layerCount ?? state.engine.layerCount,
        curves: state.curves,
      })
      elevationTokens[level.name] = {
        $type: "shadow",
        $value: buildDtcgShadowValue(layers, state.shadowColorHex, state.accentColorHex, colorFormat),
        zIndex: { $type: "number", $value: level.zIndex },
      }
    }
  }

  const output = {
    elevation: elevationTokens,
  }

  return JSON.stringify(output, null, 2)
}

/* ── Undo/Redo History ────────────────────────────────────────────── */

const HISTORY_MAX = 50

// High-frequency action types that merge instead of pushing to history
const HIGH_FREQ_TYPES = new Set(["SET_ENGINE", "SET_DEPTH", "SET_CURVE", "SET_INTERACTION_STATE"])

type PaletteAction =
  | { type: "SET_ENGINE"; key: keyof EngineParams; value: number }
  | { type: "SET_COLOR"; hex: string }
  | { type: "SET_ACCENT"; hex: string | null }
  | { type: "SET_PREVIEW"; key: keyof PreviewConfig; hex: string }
  | { type: "SET_DEPTH"; index: number; depth: number }
  | { type: "SET_ZINDEX"; index: number; zIndex: number }
  | { type: "SET_NAME"; index: number; name: string }
  | { type: "SET_TYPE"; index: number; elevationType: ElevationType; defaults: { intensity: number; hardness: number; shadowColorHex: string; accentColorHex: string | null; surfaceHex: string } }
  | { type: "SET_LAYER_COUNT"; index: number; layerCount: LayerCount | undefined }
  | { type: "SET_INTERACTION_STATE"; index: number; stateName: InteractionStateName; key: keyof InteractionStateConfig; value: number | string | null }
  | { type: "SET_INTERACTION_ENABLED"; index: number; stateName: InteractionStateName; enabled: boolean }
  | { type: "SET_CURVE"; key: keyof ShadowCurves; points: CurvePoint[] }
  | { type: "SET_COLOR_FORMAT"; format: ColorFormat }
  | { type: "SET_PREVIEW_LAYOUT"; layout: PreviewLayout }
  | { type: "ADD_ELEVATION" }
  | { type: "REMOVE_ELEVATION"; index: number }
  | { type: "RESET" }
  | { type: "UNDO" }
  | { type: "REDO" }

interface HistoryState {
  past: PaletteState[]
  present: PaletteState
  future: PaletteState[]
  lastAction: string | null
}

function isMergeable(action: PaletteAction, lastAction: string | null): boolean {
  if (!HIGH_FREQ_TYPES.has(action.type)) return false
  // Merge key must match
  if (action.type === "SET_ENGINE") return lastAction === `SET_ENGINE:${action.key}`
  if (action.type === "SET_DEPTH") return lastAction === `SET_DEPTH:${action.index}`
  if (action.type === "SET_CURVE") return lastAction === `SET_CURVE:${action.key}`
  if (action.type === "SET_INTERACTION_STATE") return lastAction === `SET_INTERACTION_STATE:${action.index}:${action.stateName}:${action.key}`
  return false
}

function actionKey(action: PaletteAction): string {
  if (action.type === "SET_ENGINE") return `SET_ENGINE:${action.key}`
  if (action.type === "SET_DEPTH") return `SET_DEPTH:${action.index}`
  if (action.type === "SET_CURVE") return `SET_CURVE:${action.key}`
  if (action.type === "SET_INTERACTION_STATE") return `SET_INTERACTION_STATE:${action.index}:${action.stateName}:${action.key}`
  return action.type
}

function applyAction(state: PaletteState, action: PaletteAction): PaletteState {
  switch (action.type) {
    case "SET_ENGINE":
      return { ...state, engine: { ...state.engine, [action.key]: action.value } }
    case "SET_COLOR":
      return { ...state, shadowColorHex: action.hex }
    case "SET_ACCENT":
      return { ...state, accentColorHex: action.hex }
    case "SET_PREVIEW":
      return { ...state, preview: { ...state.preview, [action.key]: action.hex } }
    case "SET_DEPTH":
      return { ...state, elevations: state.elevations.map((el, i) => (i === action.index ? { ...el, depth: action.depth } : el)) }
    case "SET_ZINDEX":
      return { ...state, elevations: state.elevations.map((el, i) => (i === action.index ? { ...el, zIndex: action.zIndex } : el)) }
    case "SET_NAME":
      return { ...state, elevations: state.elevations.map((el, i) => (i === action.index ? { ...el, name: action.name } : el)) }
    case "SET_TYPE":
      return {
        ...state,
        elevations: state.elevations.map((el, i) => {
          if (i !== action.index) return el
          if (action.elevationType === "interactive" && !el.interactionStates) {
            return {
              ...el,
              type: action.elevationType,
              enabledStates: { default: true, hover: true, active: true },
              interactionStates: createDefaultInteractionStates(
                el.depth,
                action.defaults.intensity,
                action.defaults.hardness,
                action.defaults.shadowColorHex,
                action.defaults.accentColorHex,
                action.defaults.surfaceHex,
              ),
            }
          }
          return { ...el, type: action.elevationType }
        }),
      }
    case "SET_LAYER_COUNT":
      return { ...state, elevations: state.elevations.map((el, i) => (i === action.index ? { ...el, layerCount: action.layerCount } : el)) }
    case "SET_INTERACTION_STATE":
      return {
        ...state,
        elevations: state.elevations.map((el, i) => {
          if (i !== action.index || !el.interactionStates) return el
          return {
            ...el,
            interactionStates: {
              ...el.interactionStates,
              [action.stateName]: { ...el.interactionStates[action.stateName], [action.key]: action.value },
            },
          }
        }),
      }
    case "SET_INTERACTION_ENABLED":
      return {
        ...state,
        elevations: state.elevations.map((el, i) => {
          if (i !== action.index) return el
          const prevEnabled = el.enabledStates ?? { default: true, hover: true, active: true }
          return { ...el, enabledStates: { ...prevEnabled, [action.stateName]: action.enabled } }
        }),
      }
    case "SET_CURVE":
      return { ...state, curves: { ...state.curves, [action.key]: action.points } }
    case "SET_COLOR_FORMAT":
      return { ...state, colorFormat: action.format }
    case "SET_PREVIEW_LAYOUT":
      return { ...state, previewLayout: action.layout }
    case "ADD_ELEVATION": {
      const last = state.elevations[state.elevations.length - 1]
      const newDepth = Math.min(1, (last?.depth ?? 0.5) + 0.1)
      const newZIndex = (last?.zIndex ?? 0) + 1
      const newName = `custom-${state.elevations.length + 1}`
      return { ...state, elevations: [...state.elevations, { name: newName, depth: newDepth, zIndex: newZIndex, type: "static" as const }] }
    }
    case "REMOVE_ELEVATION":
      return { ...state, elevations: state.elevations.filter((_, i) => i !== action.index) }
    case "RESET":
      return DEFAULTS
    default:
      return state
  }
}

function historyReducer(history: HistoryState, action: PaletteAction): HistoryState {
  if (action.type === "UNDO") {
    if (history.past.length === 0) return history
    const previous = history.past[history.past.length - 1]
    return {
      past: history.past.slice(0, -1),
      present: previous,
      future: [history.present, ...history.future],
      lastAction: null,
    }
  }

  if (action.type === "REDO") {
    if (history.future.length === 0) return history
    const next = history.future[0]
    return {
      past: [...history.past, history.present],
      present: next,
      future: history.future.slice(1),
      lastAction: null,
    }
  }

  const newPresent = applyAction(history.present, action)
  if (newPresent === history.present) return history

  const key = actionKey(action)

  // Merge strategy for high-frequency actions
  if (isMergeable(action, history.lastAction)) {
    return {
      past: history.past,
      present: newPresent,
      future: [],
      lastAction: key,
    }
  }

  return {
    past: [...history.past.slice(-(HISTORY_MAX - 1)), history.present],
    present: newPresent,
    future: [],
    lastAction: key,
  }
}

/* ── Main component ──────────────────────────────────────────────── */

type SidebarTabValue = "preview" | "css" | "json"

const STORAGE_KEY = "elevation-station-v1"

/* ── Compact URL serialization ────────────────────────────────────── */

/** Try to match a CurvePoint[] to a known preset name. */
function curveToPresetName(points: CurvePoint[]): string | null {
  for (const preset of CURVE_PRESETS) {
    if (preset.points.length !== points.length) continue
    if (preset.points.every((p, i) => p.x === points[i].x && p.y === points[i].y)) {
      return preset.label
    }
  }
  return null
}

// Key mappings: long → short for URL encoding
const KEY_TO_SHORT: Record<string, string> = {
  shadowColorHex: "sch", accentColorHex: "ach",
  componentBgHex: "cbg", componentTextHex: "ctx",
  interactionStates: "is", enabledStates: "es",
  layerDistribution: "ld", offsetGrowth: "og", alphaDistribution: "ad",
  intensity: "i", hardness: "h", depth: "d",
  lightX: "lx", lightY: "ly", layerCount: "lc",
  surfaceHex: "sh", bgHex: "bg",
  colorFormat: "cf", previewLayout: "pl",
  elevations: "el", engine: "en", preview: "pv", curves: "cv",
  zIndex: "z", name: "n", type: "t",
}
const SHORT_TO_KEY = Object.fromEntries(Object.entries(KEY_TO_SHORT).map(([k, v]) => [v, k]))

function shortenKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(shortenKeys)
  if (obj !== null && typeof obj === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[KEY_TO_SHORT[k] ?? k] = shortenKeys(v)
    }
    return out
  }
  return obj
}

function expandKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(expandKeys)
  if (obj !== null && typeof obj === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[SHORT_TO_KEY[k] ?? k] = expandKeys(v)
    }
    return out
  }
  return obj
}

/** Produce a smaller JSON-serializable object for URL encoding. */
function compactState(state: PaletteState): unknown {
  // Replace curve point arrays with preset names when they match
  const curves: Record<string, string | CurvePoint[]> = {}
  for (const [key, points] of Object.entries(state.curves)) {
    if (!points) continue
    const name = curveToPresetName(points as CurvePoint[])
    curves[key] = name ?? (points as CurvePoint[])
  }

  return shortenKeys({ ...state, curves })
}

/** Restore a compacted state back to full PaletteState. */
function expandState(raw: unknown): PaletteState {
  const expanded = expandKeys(raw) as PaletteState

  // Resolve curve preset names back to point arrays
  if (expanded.curves) {
    const resolvedCurves: Record<string, CurvePoint[]> = {}
    for (const [key, val] of Object.entries(expanded.curves)) {
      if (typeof val === "string") {
        resolvedCurves[key] = resolvePreset(val as Parameters<typeof resolvePreset>[0])
      } else {
        resolvedCurves[key] = val as CurvePoint[]
      }
    }
    expanded.curves = resolvedCurves as ShadowCurves
  }

  return expanded
}

function loadInitialState(): PaletteState {
  try {
    // Priority 1: URL hash (compressed + compact)
    if (location.hash.startsWith("#s=")) {
      const json = decompressFromEncodedURIComponent(location.hash.slice(3))
      if (json) return expandState(JSON.parse(json))
    }
    // Legacy: uncompressed base64 hash
    if (location.hash.startsWith("#state=")) {
      return expandState(JSON.parse(atob(location.hash.slice(7))))
    }
  } catch { /* ignore */ }
  try {
    // Priority 2: localStorage
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved) as PaletteState
  } catch { /* ignore */ }
  return DEFAULTS
}

function ShareButton({ buildUrl }: { buildUrl: () => string }) {
  const [shareState, setShareState] = useState<ButtonState>("idle")
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleShare = useCallback(() => {
    clearTimeout(timeoutRef.current)
    const url = buildUrl()
    void navigator.clipboard.writeText(url).then(
      () => {
        setShareState("success")
        timeoutRef.current = setTimeout(() => setShareState("idle"), 2000)
      },
      () => {
        setShareState("error")
        timeoutRef.current = setTimeout(() => setShareState("idle"), 2000)
      },
    )
  }, [buildUrl])

  return (
    <Button
      emphasis="low"
      size="sm"
      state={shareState}
      stateLabels={{ idle: "Share", success: "Link copied!", error: "Failed" }}
      onClick={handleShare}
    />
  )
}

export function ShadowTokenDesigner() {
  const [history, dispatch] = useReducer(historyReducer, null, () => ({
    past: [],
    present: loadInitialState(),
    future: [],
    lastAction: null,
  }))
  const state = history.present
  const [sidebarTab, setSidebarTab] = useState<SidebarTabValue>("preview")
  const gridRef = useRef<HTMLDivElement>(null)

  const colorFormat = state.colorFormat
  const previewLayout = state.previewLayout

  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0

  // Debounced localStorage persistence
  useEffect(() => {
    const id = setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(state)), 500)
    return () => clearTimeout(id)
  }, [state])

  // Clear URL hash after loading from it (so it doesn't persist in the address bar)
  useEffect(() => {
    if (location.hash.startsWith("#s=") || location.hash.startsWith("#state=")) {
      window.history.replaceState(null, "", location.pathname)
    }
  }, [])

  // Build a share URL on demand
  const buildShareUrl = useCallback(() => {
    const compressed = compressToEncodedURIComponent(JSON.stringify(compactState(state)))
    return `${location.origin}${location.pathname}#s=${compressed}`
  }, [state])

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        dispatch({ type: "UNDO" })
      } else if (mod && e.key === "z" && e.shiftKey) {
        e.preventDefault()
        dispatch({ type: "REDO" })
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleEngineChange = useCallback((key: keyof EngineParams, value: number) => {
    dispatch({ type: "SET_ENGINE", key, value })
  }, [])

  const handleColorChange = useCallback((hex: string) => {
    dispatch({ type: "SET_COLOR", hex })
  }, [])

  const handleAccentColorChange = useCallback((hex: string | null) => {
    dispatch({ type: "SET_ACCENT", hex })
  }, [])

  const handlePreviewChange = useCallback((key: keyof PreviewConfig, hex: string) => {
    dispatch({ type: "SET_PREVIEW", key, hex })
  }, [])

  const handleDepthChange = useCallback((index: number, depth: number) => {
    dispatch({ type: "SET_DEPTH", index, depth })
  }, [])

  const handleZIndexChange = useCallback((index: number, zIndex: number) => {
    dispatch({ type: "SET_ZINDEX", index, zIndex })
  }, [])

  const handleReset = useCallback(() => {
    dispatch({ type: "RESET" })
  }, [])

  const handleAddElevation = useCallback(() => {
    dispatch({ type: "ADD_ELEVATION" })
  }, [])

  const handleNameChange = useCallback((index: number, name: string) => {
    dispatch({ type: "SET_NAME", index, name })
  }, [])

  const handleRemoveElevation = useCallback((index: number) => {
    dispatch({ type: "REMOVE_ELEVATION", index })
  }, [])

  const handleCurveChange = useCallback((key: keyof ShadowCurves, points: CurvePoint[]) => {
    dispatch({ type: "SET_CURVE", key, points })
  }, [])

  const handleTypeChange = useCallback((index: number, elevationType: ElevationType) => {
    dispatch({
      type: "SET_TYPE",
      index,
      elevationType,
      defaults: {
        intensity: state.engine.intensity,
        hardness: state.engine.hardness,
        shadowColorHex: state.shadowColorHex,
        accentColorHex: state.accentColorHex,
        surfaceHex: state.preview.surfaceHex,
      },
    })
  }, [state.engine.intensity, state.engine.hardness, state.shadowColorHex, state.accentColorHex, state.preview.surfaceHex])

  const handleLayerCountChange = useCallback((index: number, layerCount: LayerCount | undefined) => {
    dispatch({ type: "SET_LAYER_COUNT", index, layerCount })
  }, [])

  const handleInteractionStateEnabledChange = useCallback(
    (index: number, stateName: InteractionStateName, enabled: boolean) => {
      dispatch({ type: "SET_INTERACTION_ENABLED", index, stateName, enabled })
    },
    [],
  )

  const handleInteractionStateChange = useCallback(
    (index: number, stateName: InteractionStateName, key: keyof InteractionStateConfig, value: number | string | null) => {
      dispatch({ type: "SET_INTERACTION_STATE", index, stateName, key, value })
    },
    [],
  )

  const setColorFormat = useCallback((format: ColorFormat) => {
    dispatch({ type: "SET_COLOR_FORMAT", format })
  }, [])

  const setPreviewLayout = useCallback((layout: PreviewLayout) => {
    dispatch({ type: "SET_PREVIEW_LAYOUT", layout })
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

  const cssOutput = useMemo(() => sidebarTab === "css" ? formatCssOutput(shadowColorHsl, accentColorHsl, state, shadowStacks, interactiveShadowStacks, interactiveColorHsls) : "", [shadowColorHsl, accentColorHsl, state, shadowStacks, interactiveShadowStacks, interactiveColorHsls, sidebarTab])
  const jsonOutput = useMemo(() => sidebarTab === "json" ? formatTokenJson(state, colorFormat) : "", [state, colorFormat, sidebarTab])

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
          <div className="es-shadow-token-designer__header-actions">
            <Button emphasis="low" size="sm" disabled={!canUndo} onClick={() => dispatch({ type: "UNDO" })} aria-label="Undo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
            </Button>
            <Button emphasis="low" size="sm" disabled={!canRedo} onClick={() => dispatch({ type: "REDO" })} aria-label="Redo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" /></svg>
            </Button>
            <ShareButton buildUrl={buildShareUrl} />
            <Button emphasis="low" size="sm" onClick={handleReset}>
              Reset Defaults
            </Button>
          </div>
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
