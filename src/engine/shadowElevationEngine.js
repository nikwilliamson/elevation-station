// tokens/utils/shadowElevationEngine.js

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function clamp(min, max, n) {
  return Math.max(min, Math.min(max, n));
}

function clamp01(n) {
  return clamp(0, 1, n);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function formatAlpha(n) {
  const s = (Math.round(n * 1000) / 1000).toFixed(3);
  return s.replace(/\.?0+$/, '');
}

function formatPx(n) {
  const abs = Math.abs(n);
  if (abs < 2) {
    const s = (Math.round(n * 100) / 100).toFixed(2);
    return `${s.replace(/\.?0+$/, '')}px`;
  }
  return `${round1(n)}px`;
}

function remap01(x, inMin, inMax) {
  const denom = inMax - inMin;
  if (!Number.isFinite(denom) || denom === 0) return 0;
  return clamp01((x - inMin) / denom);
}

function isFiniteNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

function stableStringify(obj) {
  // tiny stable stringify for caching keys (sorted keys, shallow-ish)
  if (!obj || typeof obj !== 'object') return String(obj);
  const keys = Object.keys(obj).sort();
  const out = {};
  for (const k of keys) {
    const v = obj[k];
    out[k] = v && typeof v === 'object' ? stableStringify(v) : v;
  }
  return JSON.stringify(out);
}

// ──────────────────────────────────────────────────────────────────────────────
// Cubic-bezier (CSS-like): given x in [0,1], return y in [0,1]
// This matches what bezier editors produce (x1,y1,x2,y2).
//
// We solve for param t such that BezierX(t) = x, then return BezierY(t).
// ──────────────────────────────────────────────────────────────────────────────

function bezierCoord(t, c1, c2) {
  // cubic bezier with p0=0, p3=1
  const u = 1 - t;
  return 3 * u * u * t * c1 + 3 * u * t * t * c2 + t * t * t;
}

function bezierCoordDeriv(t, c1, c2) {
  // derivative of bezierCoord wrt t
  const u = 1 - t;
  return 3 * u * u * c1 + 6 * u * t * (c2 - c1) + 3 * t * t * (1 - c2);
}

function cubicBezierAtX(x, x1, y1, x2, y2) {
  // Clamp editor inputs defensively; bezier editors usually ensure x1/x2 in [0,1]
  const X = clamp01(x);
  const cx1 = clamp01(x1);
  const cx2 = clamp01(x2);
  const cy1 = clamp01(y1);
  const cy2 = clamp01(y2);

  // Fast path for linear
  if (cx1 === cy1 && cx2 === cy2 && cx1 === 0 && cx2 === 1) return X;

  // Newton-Raphson + bisection fallback
  let t = X; // good starting guess
  for (let i = 0; i < 6; i++) {
    const xEst = bezierCoord(t, cx1, cx2);
    const dx = xEst - X;
    if (Math.abs(dx) < 1e-5) break;
    const d = bezierCoordDeriv(t, cx1, cx2);
    if (Math.abs(d) < 1e-6) break;
    t = clamp01(t - dx / d);
  }

  // If NR didn't converge well, bisection
  let xEst = bezierCoord(t, cx1, cx2);
  if (Math.abs(xEst - X) > 1e-3) {
    let lo = 0;
    let hi = 1;
    t = X;
    for (let i = 0; i < 20; i++) {
      xEst = bezierCoord(t, cx1, cx2);
      if (Math.abs(xEst - X) < 1e-5) break;
      if (xEst < X) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
  }

  return bezierCoord(t, cy1, cy2);
}

// ──────────────────────────────────────────────────────────────────────────────
// Monotone cubic Hermite spline (Fritsch–Carlson).
// Input: x in [0,1], points = [{x,y}, ...] sorted ascending by x.
// Endpoints (0,0) and (1,1) are implied if not included.
// Returns y for the given x.
// ──────────────────────────────────────────────────────────────────────────────

function evaluateSpline(x, points) {
  if (!points || points.length === 0) return x; // identity

  // Ensure endpoints
  const pts = [];
  if (points[0].x > 0.001) pts.push({ x: 0, y: 0 });
  for (const p of points) pts.push(p);
  if (pts[pts.length - 1].x < 0.999) pts.push({ x: 1, y: 1 });

  const n = pts.length;
  if (n === 1) return pts[0].y;
  if (n === 2) {
    // Linear between two points
    const t = remap01(x, pts[0].x, pts[1].x);
    return lerp(pts[0].y, pts[1].y, t);
  }

  // Clamp x
  const X = clamp01(x);
  if (X <= pts[0].x) return pts[0].y;
  if (X >= pts[n - 1].x) return pts[n - 1].y;

  // Compute secants
  const delta = [];
  const h = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(pts[i + 1].x - pts[i].x);
    delta.push(h[i] > 0 ? (pts[i + 1].y - pts[i].y) / h[i] : 0);
  }

  // Compute tangents (Fritsch–Carlson monotone)
  const m = new Array(n);
  m[0] = delta[0];
  m[n - 1] = delta[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (delta[i - 1] * delta[i] <= 0) {
      m[i] = 0;
    } else {
      m[i] = (delta[i - 1] + delta[i]) / 2;
    }
  }

  // Fritsch–Carlson monotonicity correction
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(delta[i]) < 1e-12) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const alpha = m[i] / delta[i];
      const beta = m[i + 1] / delta[i];
      const tau = alpha * alpha + beta * beta;
      if (tau > 9) {
        const s = 3 / Math.sqrt(tau);
        m[i] = s * alpha * delta[i];
        m[i + 1] = s * beta * delta[i];
      }
    }
  }

  // Find segment
  let seg = 0;
  for (let i = 0; i < n - 1; i++) {
    if (X >= pts[i].x && X <= pts[i + 1].x) { seg = i; break; }
  }

  // Hermite basis evaluation
  const dx = pts[seg + 1].x - pts[seg].x;
  const t = dx > 0 ? (X - pts[seg].x) / dx : 0;
  const t2 = t * t;
  const t3 = t2 * t;

  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;

  return h00 * pts[seg].y + h10 * dx * m[seg] + h01 * pts[seg + 1].y + h11 * dx * m[seg + 1];
}

function curve01(x, curve) {
  if (!curve) return x;
  // Spline: array of {x,y} points
  if (Array.isArray(curve)) return evaluateSpline(x, curve);
  // Spline: object with points array
  if (curve.points) return evaluateSpline(x, curve.points);
  // Bezier: {x1,y1,x2,y2}
  return cubicBezierAtX(x, curve.x1, curve.y1, curve.x2, curve.y2);
}

// ──────────────────────────────────────────────────────────────────────────────
// Shadow stack engine
// Curves are all editor-friendly cubic-beziers.
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {{x1:number,y1:number,x2:number,y2:number}} Bezier
 * @typedef {{x:number,y:number}} SplinePoint
 * @typedef {Bezier | SplinePoint[] | {points: SplinePoint[]}} CurveDef
 * @typedef {{
 *  layerDistribution?: CurveDef, // t -> u spacing across layers (0..1)
 *  offsetGrowth?: CurveDef,       // En -> D growth curve (0..1)
 *  alphaDistribution?: CurveDef,  // u -> weight shaping (0..1), optional
 * }} ShadowCurves
 */

/**
 * @typedef {object} ShadowParams
 * @property {number} depth        0..1
 * @property {number} lightX       -1..1
 * @property {number} lightY       -1..1
 * @property {number} intensity    0..1
 * @property {number} hardness     0..1
 * @property {number} resolution   0..1 (used only when layerCount not set)
 * @property {number=} layerCount  explicit integer layer count (2..10)
 * @property {ShadowCurves=} curves
 */

const _stackCache = new Map();

/**
 * Build a multi-layer CSS box-shadow stack.
 *
 * Calibrated against reference shadows from Josh Comeau's shadow palette generator.
 * Key design:
 * - Blur is a constant ratio of offset, controlled by hardness (2.1× soft → 1.05× hard)
 * - Spread is a fixed max (5px at C=1), linearly distributed across layers
 * - Alpha uses simple linear ramps: increasing for soft, decreasing for hard, uniform at mid
 * - Light direction uses eased values directly (not normalized)
 * - Offset range has wide dynamic range across depth levels
 */
export function buildShadowStack({ depth, lightX, lightY, intensity, hardness, resolution, layerCount, curves }) {
  // Normalize inputs
  const E = clamp01(isFiniteNumber(depth) ? depth : 0);
  const O = clamp01(isFiniteNumber(intensity) ? intensity : 0);
  const C = clamp01(isFiniteNumber(hardness) ? hardness : 0);
  const R = clamp01(isFiniteNumber(resolution) ? resolution : 0);

  const rawLx = clamp(-1, 1, isFiniteNumber(lightX) ? lightX : 0);
  const rawLy = clamp(-1, 1, isFiniteNumber(lightY) ? lightY : 1);

  // Cache key (stable enough for build-time)
  const cacheKey = stableStringify({
    E, O, C, R,
    layerCount: layerCount ?? null,
    lightX: rawLx, lightY: rawLy,
    curves: curves ?? null,
  });
  const cached = _stackCache.get(cacheKey);
  if (cached) return cached;

  // Remap elevation so low elevation isn't "dead"
  const En = remap01(E, 0.1, 0.85);

  // ── Light direction ─────────────────────────────────────────────────────────
  // Ease so near-overhead is subtle, angled is dramatic.
  // NOT normalized — diagonal light naturally casts longer shadows.
  const lx = Math.sign(rawLx) * Math.pow(Math.abs(rawLx), 1.5);
  const ly = Math.sign(rawLy) * Math.pow(Math.abs(rawLy), 1.5);

  // ── Layer count ─────────────────────────────────────────────────────────────
  let N;
  if (layerCount != null && layerCount >= 2) {
    N = clamp(2, 10, Math.round(layerCount));
  } else {
    const layerT = clamp01(En * R);
    N = clamp(2, 10, Math.round(lerp(3, 10, layerT)));
  }

  // ── Offset range ────────────────────────────────────────────────────────────
  // Wide dynamic range: ~3px at low depth/intensity → 150px at high depth/intensity.
  // O=0 and O=1 follow different depth curves, then lerp between them.
  const offsetMin = 1;
  const offsetAtO0 = curves?.offsetGrowth
    ? lerp(3, 50, curve01(En, curves.offsetGrowth))
    : lerp(3, 50, Math.pow(En, 2.2));
  const offsetAtO1 = curves?.offsetGrowth
    ? lerp(5, 150, curve01(En, curves.offsetGrowth))
    : lerp(5, 150, Math.pow(En, 3.1));
  const offsetMax = lerp(offsetAtO0, offsetAtO1, O);

  // ── Blur ────────────────────────────────────────────────────────────────────
  //   Soft (C=0):   blur = 2.1× offset  (big diffuse glow)
  //   Hard (C=1): blur = 1.05× offset (sharp defined edge)
  const blurRatio = lerp(2.1, 1.05, C);

  // ── Spread ──────────────────────────────────────────────────────────────────
  // Fixed max spread based on hardness, linearly distributed across layers.
  // Soft: no spread. Hard: up to -5px on the outermost layer.
  const spreadMax = lerp(0, 5, C);

  // ── Layer distribution ──────────────────────────────────────────────────────
  // Power curve: soft layers spread more evenly, hard bunches near contact.
  const defaultDistPower = lerp(1.7, 3.0, C);

  function layerU(t) {
    if (curves?.layerDistribution) return curve01(t, curves.layerDistribution);
    return Math.pow(t, defaultDistPower);
  }

  // ── Alpha ───────────────────────────────────────────────────────────────────
  // Simple linear ramps that blend based on hardness:
  //   Soft  (C=0): alpha increases from 0 (contact) to peak (outermost)
  //   Hard  (C=1): alpha decreases from peak×N/(N-1) (contact) to peak/(N-1)
  //   Mid   (C≈0.5): uniform alpha across all layers (the two ramps cancel)
  //
  // Peak alpha is controlled by intensity: 0.22 at O=0, 0.72 at O=1.
  const peak = lerp(0.22, 0.72, O);

  // Optional alpha curve reshaping (from editor)
  function alphaShape(t) {
    return curves?.alphaDistribution ? curve01(t, curves.alphaDistribution) : 1;
  }

  // ── Format layers ───────────────────────────────────────────────────────────
  const layers = [];

  for (let i = 0; i < N; i++) {
    const t = N === 1 ? 1 : i / (N - 1);
    const u = clamp01(layerU(t));

    // Geometry
    const offset = lerp(offsetMin, offsetMax, u);
    const x = offset * lx;
    const y = offset * ly;
    const blur = offset * blurRatio;
    const spread = -spreadMax * t;

    // Alpha: blend between soft ramp (increasing) and hard ramp (decreasing)
    const softAlpha = peak * t;                   // 0 at contact → peak at edge
    const hardAlpha = peak * (N - i) / (N - 1);   // peak×N/(N-1) at contact → peak/(N-1) at edge
    let alpha = lerp(softAlpha, hardAlpha, C) * alphaShape(t);
    alpha = clamp01(alpha);

    const xStr = formatPx(x);
    const yStr = formatPx(y);
    const blurStr = formatPx(blur);
    const spreadStr = formatPx(spread);

    // Inner layers = tight structural shadow (--shadow-color)
    // Outer layers = atmospheric glow (--shadow-accent, falls back to --shadow-color)
    const colorVar = t > 0.5
      ? 'var(--shadow-accent, var(--shadow-color))'
      : 'var(--shadow-color)';
    const colorStr = `hsl(${colorVar} / ${formatAlpha(alpha)})`;

    if (Math.abs(spread) < 0.05) {
      layers.push(`${xStr} ${yStr} ${blurStr} ${colorStr}`);
    } else {
      layers.push(`${xStr} ${yStr} ${blurStr} ${spreadStr} ${colorStr}`);
    }
  }

  const out = layers.length ? layers.join(',\n    ') : 'none';
  _stackCache.set(cacheKey, out);
  return out;
}

/**
 * Build a zero-opacity shadow stack with a given layer count.
 * Used as --shadow-interaction-none so elements can animate from
 * no shadow to any interactive state without snapping.
 */
export function buildZeroShadowStack(layerCount) {
  const N = clamp(2, 10, Math.round(layerCount ?? 5));
  const layers = [];

  // Keep one extra line so "none" → "some" transitions don’t reflow formatting
  layers.push('0px 0px 0px hsl(var(--shadow-accent, var(--shadow-color)) / 0)');

  for (let i = 0; i < N; i++) {
    layers.push('0px 0px 0px 0px hsl(var(--shadow-color) / 0)');
  }

  return layers.join(',\n    ');
}

// ──────────────────────────────────────────────────────────────────────────────
// Token → CSS var builder (kept compatible with your token shape)
// ──────────────────────────────────────────────────────────────────────────────

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), obj);
}

function unwrapTokenValue(maybeToken) {
  if (!maybeToken) return undefined;
  if (typeof maybeToken === 'object' && '$value' in maybeToken) return maybeToken.$value;
  if (typeof maybeToken === 'object' && 'value' in maybeToken) return maybeToken.value;
  return maybeToken;
}

/**
 * Returns an array of css var lines:
 *   ["  --shadow-color: ...;", "  --shadow-elevation-raised:\n    ...;", ...]
 *
 * Reads the elevation_new token structure:
 *   shadow.light.x / .y          — global light direction
 *   shadow.color.hsl             — default shadow color
 *   elevation.{name}.depth       — per-level depth
 *   elevation.{name}.resolution  — per-level *layer count* (3, 5, or 7)
 *   elevation.{name}.intensity   — per-level intensity
 *   elevation.{name}.hardness    — per-level hardness
 *   interaction.resolution       — shared *layer count* for interactive states
 *   interaction.{state}.depth    — per-state depth
 *   interaction.{state}.intensity — per-state intensity
 *   interaction.{state}.hardness  — per-state hardness
 *
 * Returns [] if elevation_new tokens aren't present.
 */
export function buildShadowCssVars(dictionaryTokens) {
  const light = getByPath(dictionaryTokens, 'elevation_new.shadow.light');
  const color = getByPath(dictionaryTokens, 'elevation_new.shadow.color.hsl');
  const elevations = getByPath(dictionaryTokens, 'elevation_new.elevation');

  if (!light || !color || !elevations) return [];

  const lightX = Number(unwrapTokenValue(light.x));
  const lightY = Number(unwrapTokenValue(light.y));
  const shadowColorHsl = String(unwrapTokenValue(color));

  const lines = [];
  lines.push(`  --shadow-color: ${shadowColorHsl};`);

  // ── Static elevations ────────────────────────────────────────────
  for (const [name, cfg] of Object.entries(elevations)) {
    const depth = Number(unwrapTokenValue(cfg?.depth));
    if (!Number.isFinite(depth)) continue;

    const intensity = Number(unwrapTokenValue(cfg?.intensity) ?? 0.25);
    const hardness = Number(unwrapTokenValue(cfg?.hardness) ?? 0.25);

    // NOTE: token calls this "resolution", but it's actually an explicit layer count in your system.
    const layerCount = Number(unwrapTokenValue(cfg?.resolution) ?? 5);

    const stack = buildShadowStack({
      depth,
      lightX,
      lightY,
      intensity,
      hardness,
      resolution: 0, // unused when layerCount is set
      layerCount,
      curves: undefined, // hook up if/when you add curve tokens
    });

    lines.push(`  --shadow-elevation-${name}:`);
    lines.push(`    ${stack};`);
  }

  // ── Interactive shadows ──────────────────────────────────────────
  const interaction = getByPath(dictionaryTokens, 'elevation_new.interaction');
  if (interaction) {
    const interactionLayerCount = Number(unwrapTokenValue(interaction.resolution) ?? 5);
    const stateNames = ['default', 'hover', 'active'];

    for (const stateName of stateNames) {
      const stateCfg = interaction[stateName];
      if (!stateCfg) continue;

      const depth = Number(unwrapTokenValue(stateCfg.depth));
      if (!Number.isFinite(depth)) continue;

      const intensity = Number(unwrapTokenValue(stateCfg.intensity) ?? 0.25);
      const hardness = Number(unwrapTokenValue(stateCfg.hardness) ?? 0.25);

      const stack = buildShadowStack({
        depth,
        lightX,
        lightY,
        intensity,
        hardness,
        resolution: 0,
        layerCount: interactionLayerCount,
        curves: undefined,
      });

      lines.push(`  --shadow-interaction-${stateName}:`);
      lines.push(`    ${stack};`);
    }

    const noneStack = buildZeroShadowStack(interactionLayerCount);
    lines.push(`  --shadow-interaction-none:`);
    lines.push(`    ${noneStack};`);
  }

  return lines;
}
