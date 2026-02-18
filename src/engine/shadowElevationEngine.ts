import type { CurvePoint } from '../shared/curvePresets'
import type { ShadowCurves } from '../shared/defaults'

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface ShadowParams {
  depth: number
  lightX: number
  lightY: number
  intensity: number
  hardness: number
  resolution: number
  layerCount?: number
  curves?: ShadowCurves
}

export interface ShadowLayer {
  offsetX: number
  offsetY: number
  blur: number
  spread: number
  alpha: number
  isAccent: boolean
}

interface Bezier {
  x1: number
  y1: number
  x2: number
  y2: number
}

interface SplineWrapper {
  points: CurvePoint[]
}

type CurveDef = Bezier | CurvePoint[] | SplineWrapper

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n))
}

function clamp01(n: number): number {
  return clamp(0, 1, n)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function formatAlpha(n: number): string {
  const s = (Math.round(n * 1000) / 1000).toFixed(3)
  return s.replace(/\.?0+$/, '')
}

function formatPx(n: number): string {
  const abs = Math.abs(n)
  if (abs < 2) {
    const s = (Math.round(n * 100) / 100).toFixed(2)
    return `${s.replace(/\.?0+$/, '')}px`
  }
  return `${round1(n)}px`
}

function remap01(x: number, inMin: number, inMax: number): number {
  const denom = inMax - inMin
  if (!Number.isFinite(denom) || denom === 0) return 0
  return clamp01((x - inMin) / denom)
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n)
}

function stableStringify(obj: unknown): string {
  if (!obj || typeof obj !== 'object') return String(obj)
  const keys = Object.keys(obj).sort()
  const out: Record<string, unknown> = {}
  for (const k of keys) {
    const v = (obj as Record<string, unknown>)[k]
    out[k] = v && typeof v === 'object' ? stableStringify(v) : v
  }
  return JSON.stringify(out)
}

// ──────────────────────────────────────────────────────────────────────────────
// Cubic-bezier (CSS-like): given x in [0,1], return y in [0,1]
// ──────────────────────────────────────────────────────────────────────────────

function bezierCoord(t: number, c1: number, c2: number): number {
  const u = 1 - t
  return 3 * u * u * t * c1 + 3 * u * t * t * c2 + t * t * t
}

function bezierCoordDeriv(t: number, c1: number, c2: number): number {
  const u = 1 - t
  return 3 * u * u * c1 + 6 * u * t * (c2 - c1) + 3 * t * t * (1 - c2)
}

function cubicBezierAtX(x: number, x1: number, y1: number, x2: number, y2: number): number {
  const X = clamp01(x)
  const cx1 = clamp01(x1)
  const cx2 = clamp01(x2)
  const cy1 = clamp01(y1)
  const cy2 = clamp01(y2)

  if (cx1 === cy1 && cx2 === cy2 && cx1 === 0 && cx2 === 1) return X

  let t = X
  for (let i = 0; i < 6; i++) {
    const xEst = bezierCoord(t, cx1, cx2)
    const dx = xEst - X
    if (Math.abs(dx) < 1e-5) break
    const d = bezierCoordDeriv(t, cx1, cx2)
    if (Math.abs(d) < 1e-6) break
    t = clamp01(t - dx / d)
  }

  let xEst = bezierCoord(t, cx1, cx2)
  if (Math.abs(xEst - X) > 1e-3) {
    let lo = 0
    let hi = 1
    t = X
    for (let i = 0; i < 20; i++) {
      xEst = bezierCoord(t, cx1, cx2)
      if (Math.abs(xEst - X) < 1e-5) break
      if (xEst < X) lo = t
      else hi = t
      t = (lo + hi) / 2
    }
  }

  return bezierCoord(t, cy1, cy2)
}

// ──────────────────────────────────────────────────────────────────────────────
// Monotone cubic Hermite spline (Fritsch–Carlson)
// ──────────────────────────────────────────────────────────────────────────────

function evaluateSpline(x: number, points: CurvePoint[]): number {
  if (!points || points.length === 0) return x

  const pts: CurvePoint[] = []
  if (points[0].x > 0.001) pts.push({ x: 0, y: 0 })
  for (const p of points) pts.push(p)
  if (pts[pts.length - 1].x < 0.999) pts.push({ x: 1, y: 1 })

  const n = pts.length
  if (n === 1) return pts[0].y
  if (n === 2) {
    const t = remap01(x, pts[0].x, pts[1].x)
    return lerp(pts[0].y, pts[1].y, t)
  }

  const X = clamp01(x)
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
    if (X >= pts[i].x && X <= pts[i + 1].x) { seg = i; break }
  }

  const dx = pts[seg + 1].x - pts[seg].x
  const t = dx > 0 ? (X - pts[seg].x) / dx : 0
  const t2 = t * t
  const t3 = t2 * t

  const h00 = 2 * t3 - 3 * t2 + 1
  const h10 = t3 - 2 * t2 + t
  const h01 = -2 * t3 + 3 * t2
  const h11 = t3 - t2

  return h00 * pts[seg].y + h10 * dx * m[seg] + h01 * pts[seg + 1].y + h11 * dx * m[seg + 1]
}

function curve01(x: number, curve: CurveDef): number {
  if (!curve) return x
  if (Array.isArray(curve)) return evaluateSpline(x, curve)
  if ('points' in curve && Array.isArray((curve as SplineWrapper).points)) return evaluateSpline(x, (curve as SplineWrapper).points)
  const b = curve as Bezier
  return cubicBezierAtX(x, b.x1, b.y1, b.x2, b.y2)
}

// ──────────────────────────────────────────────────────────────────────────────
// Shadow stack engine
// ──────────────────────────────────────────────────────────────────────────────

const _stackCache = new Map<string, string>()
const _layersCache = new Map<string, ShadowLayer[]>()
const CACHE_MAX = 500

function cappedSet<K, V>(map: Map<K, V>, key: K, value: V): void {
  if (map.size >= CACHE_MAX) {
    map.delete(map.keys().next().value as K)
  }
  map.set(key, value)
}

export function buildShadowLayers({ depth, lightX, lightY, intensity, hardness, resolution, layerCount, curves }: ShadowParams): ShadowLayer[] {
  const E = clamp01(isFiniteNumber(depth) ? depth : 0)
  const O = clamp01(isFiniteNumber(intensity) ? intensity : 0)
  const C = clamp01(isFiniteNumber(hardness) ? hardness : 0)
  const R = clamp01(isFiniteNumber(resolution) ? resolution : 0)

  const rawLx = clamp(-1, 1, isFiniteNumber(lightX) ? lightX : 0)
  const rawLy = clamp(-1, 1, isFiniteNumber(lightY) ? lightY : 1)

  const cacheKey = stableStringify({
    E, O, C, R,
    layerCount: layerCount ?? null,
    lightX: rawLx, lightY: rawLy,
    curves: curves ?? null,
  })
  const cached = _layersCache.get(cacheKey)
  if (cached) return cached

  const En = clamp01(E)

  const lx = Math.sign(rawLx) * Math.pow(Math.abs(rawLx), 1.5)
  const ly = Math.sign(rawLy) * Math.pow(Math.abs(rawLy), 1.5)

  let N: number
  if (layerCount != null && layerCount >= 2) {
    N = clamp(2, 10, Math.round(layerCount))
  } else {
    const layerT = clamp01(En * R)
    N = clamp(2, 10, Math.round(lerp(3, 10, layerT)))
  }

  const offsetMin = 1
  const offsetAtO0 = curves?.offsetGrowth
    ? lerp(3, 50, curve01(En, curves.offsetGrowth))
    : lerp(3, 50, Math.pow(En, 2.2))
  const offsetAtO1 = curves?.offsetGrowth
    ? lerp(5, 150, curve01(En, curves.offsetGrowth))
    : lerp(5, 150, Math.pow(En, 3.1))
  const offsetMax = lerp(offsetAtO0, offsetAtO1, O)

  const blurRatio = lerp(2.1, 1.05, C)
  const spreadMax = lerp(0, 5, C)
  const defaultDistPower = lerp(1.7, 3.0, C)

  function layerU(t: number): number {
    if (curves?.layerDistribution) return curve01(t, curves.layerDistribution)
    return Math.pow(t, defaultDistPower)
  }

  const peak = lerp(0.22, 0.72, O)

  function alphaShape(t: number): number {
    return curves?.alphaDistribution ? curve01(t, curves.alphaDistribution) : 1
  }

  const result: ShadowLayer[] = []

  for (let i = 0; i < N; i++) {
    const t = N === 1 ? 1 : i / (N - 1)
    const u = clamp01(layerU(t))

    const offset = lerp(offsetMin, offsetMax, u)
    const x = offset * lx
    const y = offset * ly
    const blur = offset * blurRatio
    const spread = -spreadMax * t

    const softAlpha = peak * t
    const hardAlpha = peak * (N - i) / (N - 1)
    let alpha = lerp(softAlpha, hardAlpha, C) * alphaShape(t)
    alpha = clamp01(alpha)

    result.push({
      offsetX: round1(x),
      offsetY: round1(y),
      blur: round1(blur),
      spread: round1(spread),
      alpha: Math.round(alpha * 1000) / 1000,
      isAccent: t > 0.5,
    })
  }

  cappedSet(_layersCache, cacheKey, result)
  return result
}

export function buildShadowStack({ depth, lightX, lightY, intensity, hardness, resolution, layerCount, curves }: ShadowParams): string {
  const E = clamp01(isFiniteNumber(depth) ? depth : 0)
  const O = clamp01(isFiniteNumber(intensity) ? intensity : 0)
  const C = clamp01(isFiniteNumber(hardness) ? hardness : 0)
  const R = clamp01(isFiniteNumber(resolution) ? resolution : 0)
  const rawLx = clamp(-1, 1, isFiniteNumber(lightX) ? lightX : 0)
  const rawLy = clamp(-1, 1, isFiniteNumber(lightY) ? lightY : 1)

  const cacheKey = stableStringify({
    E, O, C, R,
    layerCount: layerCount ?? null,
    lightX: rawLx, lightY: rawLy,
    curves: curves ?? null,
  })
  const cached = _stackCache.get(cacheKey)
  if (cached) return cached

  const layerData = buildShadowLayers({ depth, lightX, lightY, intensity, hardness, resolution, layerCount, curves })

  const layers = layerData.map((layer) => {
    const xStr = formatPx(layer.offsetX)
    const yStr = formatPx(layer.offsetY)
    const blurStr = formatPx(layer.blur)
    const spreadStr = formatPx(layer.spread)

    const colorVar = layer.isAccent
      ? 'var(--shadow-accent, var(--shadow-color))'
      : 'var(--shadow-color)'
    const colorStr = `hsl(${colorVar} / ${formatAlpha(layer.alpha)})`

    if (Math.abs(layer.spread) < 0.05) {
      return `${xStr} ${yStr} ${blurStr} ${colorStr}`
    }
    return `${xStr} ${yStr} ${blurStr} ${spreadStr} ${colorStr}`
  })

  const out = layers.length ? layers.join(',\n    ') : 'none'
  cappedSet(_stackCache, cacheKey, out)
  return out
}

export function buildZeroShadowStack(layerCount?: number): string {
  const N = clamp(2, 10, Math.round(layerCount ?? 5))
  const layers: string[] = []

  layers.push('0px 0px 0px hsl(var(--shadow-accent, var(--shadow-color)) / 0)')

  for (let i = 0; i < N; i++) {
    layers.push('0px 0px 0px 0px hsl(var(--shadow-color) / 0)')
  }

  return layers.join(',\n    ')
}

// ──────────────────────────────────────────────────────────────────────────────
// Token → CSS var builder
// ──────────────────────────────────────────────────────────────────────────────

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => (acc && typeof acc === 'object' && (acc as Record<string, unknown>)[key] != null ? (acc as Record<string, unknown>)[key] : undefined), obj)
}

function unwrapTokenValue(maybeToken: unknown): unknown {
  if (!maybeToken) return undefined
  if (typeof maybeToken === 'object' && maybeToken !== null && '$value' in maybeToken) return (maybeToken as Record<string, unknown>).$value
  if (typeof maybeToken === 'object' && maybeToken !== null && 'value' in maybeToken) return (maybeToken as Record<string, unknown>).value
  return maybeToken
}

export function buildShadowCssVars(dictionaryTokens: Record<string, unknown>): string[] {
  const light = getByPath(dictionaryTokens, 'elevation_new.shadow.light') as Record<string, unknown> | undefined
  const color = getByPath(dictionaryTokens, 'elevation_new.shadow.color.hsl')
  const elevations = getByPath(dictionaryTokens, 'elevation_new.elevation') as Record<string, Record<string, unknown>> | undefined

  if (!light || !color || !elevations) return []

  const lightX = Number(unwrapTokenValue(light.x))
  const lightY = Number(unwrapTokenValue(light.y))
  const shadowColorHsl = String(unwrapTokenValue(color))

  const lines: string[] = []
  lines.push(`  --shadow-color: ${shadowColorHsl};`)

  for (const [name, cfg] of Object.entries(elevations)) {
    const depth = Number(unwrapTokenValue(cfg?.depth))
    if (!Number.isFinite(depth)) continue

    const intensityVal = unwrapTokenValue(cfg?.intensity)
    const hardnessVal = unwrapTokenValue(cfg?.hardness)
    const resolutionVal = unwrapTokenValue(cfg?.resolution)

    const intensity = Number(intensityVal ?? 0.25)
    const hardness = Number(hardnessVal ?? 0.25)
    const layerCount = Number(resolutionVal ?? 5)

    const stack = buildShadowStack({
      depth,
      lightX,
      lightY,
      intensity,
      hardness,
      resolution: 0,
      layerCount,
    })

    lines.push(`  --shadow-elevation-${name}:`)
    lines.push(`    ${stack};`)
  }

  const interaction = getByPath(dictionaryTokens, 'elevation_new.interaction') as Record<string, unknown> | undefined
  if (interaction) {
    const interactionLayerCount = Number(unwrapTokenValue(interaction.resolution) ?? 5)
    const stateNames = ['default', 'hover', 'active']

    for (const stateName of stateNames) {
      const stateCfg = interaction[stateName] as Record<string, unknown> | undefined
      if (!stateCfg) continue

      const depth = Number(unwrapTokenValue(stateCfg.depth))
      if (!Number.isFinite(depth)) continue

      const intensity = Number(unwrapTokenValue(stateCfg.intensity) ?? 0.25)
      const hardness = Number(unwrapTokenValue(stateCfg.hardness) ?? 0.25)

      const stack = buildShadowStack({
        depth,
        lightX,
        lightY,
        intensity,
        hardness,
        resolution: 0,
        layerCount: interactionLayerCount,
      })

      lines.push(`  --shadow-interaction-${stateName}:`)
      lines.push(`    ${stack};`)
    }

    const noneStack = buildZeroShadowStack(interactionLayerCount)
    lines.push(`  --shadow-interaction-none:`)
    lines.push(`    ${noneStack};`)
  }

  return lines
}
