import React, { useCallback, useId, useMemo, useRef, useState } from "react"

import { motion } from "motion/react"

import { CURVE_PRESETS, type CurvePoint } from "../../shared/curvePresets"
import { Legend } from "../legend/Legend"
import { TabSelect } from "../tabSelect/TabSelect"

import "./bezierCurveEditor.css"

/* ── Types ─────────────────────────────────────────────────────── */

export type { CurvePoint }

interface AxisLabels {
  x: [string, string]
  y: [string, string]
}

interface SplineCurveEditorProps {
  /** Array of interior points (endpoints 0,0 and 1,1 are implicit) */
  points: CurvePoint[]
  onChange: (points: CurvePoint[]) => void
  /** Curve stroke color */
  color?: string
  /** Grid/axis line color */
  axisColor?: string
  /** Accessible label for the preset nav */
  label?: string
  /** Optional x-axis markers (0–1) shown as ticks with dots on the curve */
  xMarkers?: number[]
  /** Optional x-axis grid lines (0–1) replacing the default x grid */
  xGridLines?: number[]
  /** Labels for each axis: x is [low, high], y is [low, high] */
  axisLabels?: AxisLabels
}

const PRESET_TAB_OPTIONS = CURVE_PRESETS.map((p) => ({ label: p.label, value: p.label }))

/* ── SVG constants ─────────────────────────────────────────────── */

const SVG_SIZE = 280
const PAD = 0
const GRAPH = SVG_SIZE - PAD * 2

function toSvg(x: number, y: number): [number, number] {
  return [PAD + x * GRAPH, PAD + (1 - y) * GRAPH]
}

/* ── Monotone cubic Hermite spline (Fritsch-Carlson) ─────────── */
// Mirrors the engine implementation so the preview curve matches exactly.

function evaluateSpline(x: number, interiorPoints: CurvePoint[]): number {
  const pts: CurvePoint[] = [{ x: 0, y: 0 }]
  for (const p of interiorPoints) pts.push(p)
  pts.push({ x: 1, y: 1 })

  const n = pts.length
  if (n === 2) {
    const t = pts[1].x - pts[0].x > 0 ? (x - pts[0].x) / (pts[1].x - pts[0].x) : 0
    return pts[0].y + (pts[1].y - pts[0].y) * Math.max(0, Math.min(1, t))
  }

  const X = Math.max(0, Math.min(1, x))
  if (X <= pts[0].x) return pts[0].y
  if (X >= pts[n - 1].x) return pts[n - 1].y

  const delta: number[] = []
  const h: number[] = []
  for (let i = 0; i < n - 1; i++) {
    h.push(pts[i + 1].x - pts[i].x)
    delta.push(h[i] > 0 ? (pts[i + 1].y - pts[i].y) / h[i] : 0)
  }

  const m = new Array<number>(n)
  m[0] = delta[0]
  m[n - 1] = delta[n - 2]
  for (let i = 1; i < n - 1; i++) {
    if (delta[i - 1] * delta[i] <= 0) {
      m[i] = 0
    } else {
      m[i] = (delta[i - 1] + delta[i]) / 2
    }
  }

  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(delta[i]) < 1e-12) {
      m[i] = 0
      m[i + 1] = 0
    } else {
      const alpha = m[i] / delta[i]
      const beta = m[i + 1] / delta[i]
      const tau = alpha * alpha + beta * beta
      if (tau > 9) {
        const s = 3 / Math.sqrt(tau)
        m[i] = s * alpha * delta[i]
        m[i + 1] = s * beta * delta[i]
      }
    }
  }

  let seg = 0
  for (let i = 0; i < n - 1; i++) {
    if (X >= pts[i].x && X <= pts[i + 1].x) {
      seg = i
      break
    }
  }

  const dx = pts[seg + 1].x - pts[seg].x
  const t = dx > 0 ? (X - pts[seg].x) / dx : 0
  const t2 = t * t
  const t3 = t2 * t

  return (2 * t3 - 3 * t2 + 1) * pts[seg].y + (t3 - 2 * t2 + t) * dx * m[seg] + (-2 * t3 + 3 * t2) * pts[seg + 1].y + (t3 - t2) * dx * m[seg + 1]
}

/* ── Build SVG path from spline ────────────────────────────────── */

function buildSplinePath(interiorPoints: CurvePoint[], steps = 100): string {
  const parts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = i / steps
    const y = evaluateSpline(x, interiorPoints)
    const [sx, sy] = toSvg(x, y)
    parts.push(i === 0 ? `M ${sx},${sy}` : `L ${sx},${sy}`)
  }
  return parts.join(" ")
}

function buildFillPath(interiorPoints: CurvePoint[], steps = 100): string {
  const curvePath = buildSplinePath(interiorPoints, steps)
  const [brx, bry] = toSvg(1, 0)
  const [blx, bly] = toSvg(0, 0)
  return `${curvePath} L ${brx},${bry} L ${blx},${bly} Z`
}

/* ── Component ─────────────────────────────────────────────────── */

export function BezierCurveEditor({ points, onChange, color = "#126bf9", axisColor = "#cbd3df", label, xMarkers, xGridLines, axisLabels }: SplineCurveEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gradientId = useId()
  const [dragging, setDragging] = useState<number | null>(null)
  const [hovering, setHovering] = useState<number | null>(null)

  // Sorted points for rendering
  const sorted = [...points].sort((a, b) => a.x - b.x)

  // All points including fixed endpoints
  const allPoints: CurvePoint[] = [{ x: 0, y: 0 }, ...sorted, { x: 1, y: 1 }]

  /* ── Pointer helpers ─────────────────────────────────────────── */

  const getMathPoint = useCallback((e: { clientX: number; clientY: number }): [number, number] => {
    const canvas = canvasRef.current
    if (!canvas) return [0, 0]
    const rect = canvas.getBoundingClientRect()
    return [
      Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height)),
    ]
  }, [])

  // Drag a point
  const handlePointerDown = useCallback(
    (index: number) => (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      ;(e.target as Element).setPointerCapture(e.pointerId)
      setDragging(index)
    },
    [],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragging === null) return
      const [mx, my] = getMathPoint(e)
      const next = sorted.map((p, i) => (i === dragging ? { x: Math.max(0.01, Math.min(0.99, mx)), y: my } : p))
      onChange(next)
    },
    [dragging, onChange, sorted, getMathPoint],
  )

  const handlePointerUp = useCallback(() => {
    setDragging(null)
  }, [])

  // Add a point on click
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as Element).closest("[data-control-point]")) return
      const [mx, my] = getMathPoint(e)
      if (mx < 0.02 || mx > 0.98) return
      onChange([...sorted, { x: mx, y: my }])
    },
    [onChange, sorted, getMathPoint],
  )

  // Remove a point on double-click
  const handlePointDoubleClick = useCallback(
    (index: number) => (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onChange(sorted.filter((_, i) => i !== index))
    },
    [onChange, sorted],
  )

  /* ── Computed values ─────────────────────────────────────────── */

  const curvePath = buildSplinePath(sorted)
  const fillPath = buildFillPath(sorted)
  const linearD = `M ${toSvg(0, 0).join(",")} L ${toSvg(1, 1).join(",")}`

  // Compute marker positions (x tick + dot on curve)
  const markerData = useMemo(() => {
    if (!xMarkers?.length) return []
    return xMarkers.map((mx) => {
      const clamped = Math.max(0, Math.min(1, mx))
      const curveY = evaluateSpline(clamped, sorted)
      return { x: clamped, y: curveY }
    })
  }, [xMarkers, sorted])

  /* ── Preset matching ─────────────────────────────────────────── */

  const presetTabId = useId()

  const matchedPreset = useMemo(() => {
    const match = CURVE_PRESETS.find((preset) => {
      if (preset.points.length !== sorted.length) return false
      return preset.points.every((pp, i) => Math.abs(pp.x - sorted[i].x) < 0.02 && Math.abs(pp.y - sorted[i].y) < 0.02)
    })
    return match?.label ?? ""
  }, [sorted])

  const handlePresetChange = useCallback(
    (label: string) => {
      const preset = CURVE_PRESETS.find((p) => p.label === label)
      if (preset) onChange([...preset.points])
    },
    [onChange],
  )

  return (
    <div className="es-bezier-editor">
      {/* Canvas with optional axis labels outside */}
      <div className="es-bezier-editor__chart-area">
        {axisLabels && (
          <div className="es-bezier-editor__y-axis">
            <span className="es-bezier-editor__axis-label">{axisLabels.y[1]}</span>
            <span className="es-bezier-editor__axis-label">{axisLabels.y[0]}</span>
          </div>
        )}
        <div className="es-bezier-editor__canvas-col">
          <div
            ref={canvasRef}
            className="es-bezier-editor__canvas"
            style={{ cursor: dragging !== null ? "grabbing" : "crosshair" }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={handleCanvasClick}
          >
            <div className={`es-bezier-editor__grid${xGridLines?.length ? ' es-bezier-editor__grid--custom-x' : ''}`} />
            <Legend
              items={[
                { label: `${sorted.length} point${sorted.length !== 1 ? "s" : ""}` },
              ]}
            />
        <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="es-bezier-editor__svg">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity={0.06} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Linear reference */}
          <path d={linearD} fill="none" stroke={axisColor} strokeWidth={1} strokeDasharray="3 5" opacity={0.35} vectorEffect="non-scaling-stroke" />

          {/* Custom x-axis grid lines */}
          {xGridLines?.filter((gx) => gx > 1e-4 && gx < 1 - 1e-4).map((gx, i) => {
            const [x1, y1] = toSvg(gx, 0)
            const [x2, y2] = toSvg(gx, 1)
            return (
              <motion.line
                key={`xgrid-${i}`}
                initial={false}
                animate={{ x1, y1, x2, y2 }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                stroke="var(--border-subtle)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            )
          })}

          {/* Curve fill */}
          <motion.path initial={false} animate={{ d: fillPath }} transition={dragging !== null ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 35 }} fill={`url(#${gradientId})`} />

          {/* Segment lines connecting points (subtle) */}
          {allPoints.map((p, i) => {
            if (i === 0) return null
            const prev = allPoints[i - 1]
            const [x1, y1] = toSvg(prev.x, prev.y)
            const [x2, y2] = toSvg(p.x, p.y)
            return (
              <motion.line
                key={`seg-${i}`}
                initial={false}
                animate={{ x1, y1, x2, y2 }}
                transition={dragging !== null ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 35 }}
                stroke={color}
                strokeWidth={0.5}
                opacity={0.15}
                strokeDasharray="2 3"
                vectorEffect="non-scaling-stroke"
              />
            )
          })}

          {/* Spline curve */}
          <motion.path initial={false} animate={{ d: curvePath }} transition={dragging !== null ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 35 }} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

          {/* X-axis markers (elevation depth indicators) */}
          {markerData.map((m, i) => {
            const [dotX, dotY] = toSvg(m.x, m.y)
            const [bottomX, bottomY] = toSvg(m.x, 0)
            return (
              <g key={`marker-${i}`}>
                {/* Vertical line from bottom to dot on curve */}
                <motion.line
                  initial={false}
                  animate={{ x1: bottomX, y1: bottomY, x2: dotX, y2: dotY }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  stroke={color}
                  strokeWidth={1}
                  opacity={0.2}
                  strokeDasharray="2 3"
                  vectorEffect="non-scaling-stroke"
                />
                {/* Dot on curve */}
                <motion.circle
                  initial={false}
                  animate={{ cx: dotX, cy: dotY }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  r={3.5}
                  fill={color}
                  stroke="var(--color-neutral-800)"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            )
          })}
        </svg>

        {/* Control points — spring-animated position via motion.div */}
        {sorted.map((p, i) => (
          <motion.div
            key={i}
            data-control-point
            data-active={dragging === i || hovering === i || undefined}
            className="es-bezier-editor__point"
            animate={{ left: `${p.x * 100}%`, top: `${(1 - p.y) * 100}%` }}
            transition={dragging === i ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 35 }}
            style={{ color }}
            onPointerDown={handlePointerDown(i)}
            onPointerEnter={() => setHovering(i)}
            onPointerLeave={() => setHovering(null)}
            onDoubleClick={handlePointDoubleClick(i)}
          />
        ))}
          </div>
          {axisLabels && (
            <div className="es-bezier-editor__x-axis">
              <span className="es-bezier-editor__axis-label">{axisLabels.x[0]}</span>
              <span className="es-bezier-editor__axis-label">{axisLabels.x[1]}</span>
            </div>
          )}
        </div>
      </div>


      {/* Presets */}
      <TabSelect options={PRESET_TAB_OPTIONS} value={matchedPreset} onChange={handlePresetChange} layoutId={presetTabId} size="sm" contained={false} ariaLabel={label ? `${label} preset` : "Curve preset"} />
    </div>
  )
}
