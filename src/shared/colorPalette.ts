// ── Color format types ───────────────────────────────────────────────

export type ColorFormat = 'hex' | 'rgb' | 'lch' | 'oklch';

// ── Format display ──────────────────────────────────────────────────

function hexToRgbValues(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function hexToOklch(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgbValues(hex).map((v) => linearize(v / 255));
  // sRGB linear → OKLab
  const l_ = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m_ = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s_ = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l3 = Math.cbrt(l_);
  const m3 = Math.cbrt(m_);
  const s3 = Math.cbrt(s_);
  const L = 0.2104542553 * l3 + 0.7936177850 * m3 - 0.0040720468 * s3;
  const a = 1.9779984951 * l3 - 2.4285922050 * m3 + 0.4505937099 * s3;
  const bk = 0.0259040371 * l3 + 0.7827717662 * m3 - 0.8086757660 * s3;
  const C = Math.sqrt(a * a + bk * bk);
  let H = (Math.atan2(bk, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}

function hexToLch(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgbValues(hex).map((v) => linearize(v / 255));
  // sRGB linear → XYZ (D65)
  const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  const y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
  const z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b;
  // XYZ → Lab (D65 white)
  const fn = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const xn = 0.95047, yn = 1.0, zn = 1.08883;
  const fx = fn(x / xn), fy = fn(y / yn), fz = fn(z / zn);
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bk = 200 * (fy - fz);
  const C = Math.sqrt(a * a + bk * bk);
  let H = (Math.atan2(bk, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}

export function formatColor(hex: string, format: ColorFormat): string {
  switch (format) {
    case 'hex':
      return hex;
    case 'rgb': {
      const [r, g, b] = hexToRgbValues(hex);
      return `rgb(${r}, ${g}, ${b})`;
    }
    case 'lch': {
      const [L, C, H] = hexToLch(hex);
      return `lch(${L.toFixed(1)}% ${C.toFixed(1)} ${H.toFixed(1)})`;
    }
    case 'oklch': {
      const [L, C, H] = hexToOklch(hex);
      return `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${H.toFixed(1)})`;
    }
  }
}

// ── Parse any format back to hex ────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function delinearize(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

function oklchToHex(L: number, C: number, H: number): string {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);
  // OKLab → sRGB linear
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;
  const r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bv = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;
  const toHex = (v: number) => Math.round(clamp(delinearize(v), 0, 1) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(bv)}`;
}

function lchToHex(L: number, C: number, H: number): string {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);
  // Lab → XYZ
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const xn = 0.95047, yn = 1.0, zn = 1.08883;
  const invFn = (t: number) => (t > 0.206893 ? t * t * t : (t - 16 / 116) / 7.787);
  const x = xn * invFn(fx);
  const y = yn * invFn(fy);
  const z = zn * invFn(fz);
  // XYZ → sRGB linear
  const r = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  const g = -0.9692660 * x + 1.8760108 * y + 0.0415560 * z;
  const bv = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;
  const toHex = (v: number) => Math.round(clamp(delinearize(v), 0, 1) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(bv)}`;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const RGB_RE = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
const LCH_RE = /^lch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*\)$/;
const OKLCH_RE = /^oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*\)$/;

export function parseColorToHex(input: string): string | null {
  const trimmed = input.trim().toLowerCase();

  if (HEX_RE.test(trimmed)) return trimmed;

  const rgbMatch = trimmed.match(RGB_RE);
  if (rgbMatch) {
    const toHex = (v: string) => clamp(parseInt(v), 0, 255).toString(16).padStart(2, '0');
    return `#${toHex(rgbMatch[1])}${toHex(rgbMatch[2])}${toHex(rgbMatch[3])}`;
  }

  const oklchMatch = trimmed.match(OKLCH_RE);
  if (oklchMatch) {
    const L = parseFloat(oklchMatch[1]) / 100;
    const C = parseFloat(oklchMatch[2]);
    const H = parseFloat(oklchMatch[3]);
    return oklchToHex(L, C, H);
  }

  const lchMatch = trimmed.match(LCH_RE);
  if (lchMatch) {
    const L = parseFloat(lchMatch[1]);
    const C = parseFloat(lchMatch[2]);
    const H = parseFloat(lchMatch[3]);
    return lchToHex(L, C, H);
  }

  return null;
}

// ── HSL → Hex conversion ─────────────────────────────────────────────

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// ── Hex → HSL conversion ─────────────────────────────────────────────

export function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) return `0deg 0% ${Math.round(l * 100)}%`;

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === r) h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / delta + 2) * 60;
  else h = ((r - g) / delta + 4) * 60;

  return `${Math.round(h)}deg ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// ── Color palette from design tokens ─────────────────────────────────

export interface ColorFamily {
  name: string;
  shades: { shade: string; hex: string }[];
}

export const COLOR_PALETTE: ColorFamily[] = [
  {
    name: 'Neutral',
    shades: [
      { shade: '0', hex: '#ffffff' },
      { shade: '100', hex: '#EEEAF5' },
      { shade: '200', hex: '#D5CFE2' },
      { shade: '300', hex: '#ACA3BF' },
      { shade: '400', hex: '#817699' },
      { shade: '500', hex: '#5C5076' },
      { shade: '600', hex: '#3B2E58' },
      { shade: '700', hex: '#241545' },
      { shade: '800', hex: '#170A32' },
    ],
  },
  {
    name: 'Pink',
    shades: [
      { shade: '100', hex: '#FDF2FC' },
      { shade: '200', hex: '#F5D6F3' },
      { shade: '300', hex: '#E99CE5' },
      { shade: '400', hex: '#D970D3' },
      { shade: '500', hex: '#C850C0' },
      { shade: '600', hex: '#9E3C97' },
      { shade: '700', hex: '#6E2969' },
      { shade: '800', hex: '#3D1238' },
    ],
  },
  {
    name: 'Blue',
    shades: [
      { shade: '100', hex: '#EEEFFE' },
      { shade: '200', hex: '#D3D7FC' },
      { shade: '300', hex: '#9CA3EC' },
      { shade: '400', hex: '#6B76DE' },
      { shade: '500', hex: '#4158D0' },
      { shade: '600', hex: '#3044A8' },
      { shade: '700', hex: '#22307A' },
      { shade: '800', hex: '#131C4E' },
    ],
  },
  {
    name: 'Yellow',
    shades: [
      { shade: '100', hex: '#FFF8E8' },
      { shade: '200', hex: '#FFECBF' },
      { shade: '300', hex: '#FFDB8A' },
      { shade: '400', hex: '#FFCC70' },
      { shade: '500', hex: '#E9B34D' },
      { shade: '600', hex: '#C4912A' },
      { shade: '700', hex: '#8A6415' },
      { shade: '800', hex: '#4A3508' },
    ],
  },
  {
    name: 'Indigo',
    shades: [
      { shade: '100', hex: '#f8f7ff' },
      { shade: '200', hex: '#e6e8fc' },
      { shade: '300', hex: '#a7abff' },
      { shade: '400', hex: '#7673f6' },
      { shade: '500', hex: '#624bff' },
      { shade: '600', hex: '#4230b1' },
      { shade: '700', hex: '#2a1c7c' },
      { shade: '800', hex: '#10083d' },
    ],
  },
  {
    name: 'Plum',
    shades: [
      { shade: '100', hex: '#fbf5ff' },
      { shade: '200', hex: '#f3e5ff' },
      { shade: '300', hex: '#d0a3f3' },
      { shade: '400', hex: '#b46dec' },
      { shade: '500', hex: '#9636df' },
      { shade: '600', hex: '#6e29a7' },
      { shade: '700', hex: '#491a70' },
      { shade: '800', hex: '#20023a' },
    ],
  },
  {
    name: 'Berry',
    shades: [
      { shade: '100', hex: '#fff6fb' },
      { shade: '200', hex: '#fee1eb' },
      { shade: '300', hex: '#fa9ac0' },
      { shade: '400', hex: '#f0569e' },
      { shade: '500', hex: '#da1583' },
      { shade: '600', hex: '#910e56' },
      { shade: '700', hex: '#65053a' },
      { shade: '800', hex: '#310019' },
    ],
  },
  {
    name: 'Red',
    shades: [
      { shade: '100', hex: '#FFF0F0' },
      { shade: '200', hex: '#ffe2e1' },
      { shade: '300', hex: '#ff9fa0' },
      { shade: '400', hex: '#fc6a67' },
      { shade: '500', hex: '#ed3533' },
      { shade: '600', hex: '#D93636' },
      { shade: '700', hex: '#6b0d0e' },
      { shade: '800', hex: '#340a08' },
    ],
  },
  {
    name: 'Fire',
    shades: [
      { shade: '100', hex: '#fff7f5' },
      { shade: '200', hex: '#ffe4db' },
      { shade: '300', hex: '#ffa78b' },
      { shade: '400', hex: '#ff7a51' },
      { shade: '500', hex: '#f3501c' },
      { shade: '600', hex: '#b54225' },
      { shade: '700', hex: '#621b05' },
      { shade: '800', hex: '#2d0f05' },
    ],
  },
  {
    name: 'Orange',
    shades: [
      { shade: '100', hex: '#fffaf6' },
      { shade: '200', hex: '#ffead9' },
      { shade: '300', hex: '#ffba84' },
      { shade: '400', hex: '#f99545' },
      { shade: '500', hex: '#ec7204' },
      { shade: '600', hex: '#b25500' },
      { shade: '700', hex: '#5b2800' },
      { shade: '800', hex: '#281204' },
    ],
  },
  {
    name: 'Gold',
    shades: [
      { shade: '100', hex: '#fffbf6' },
      { shade: '200', hex: '#ffecd0' },
      { shade: '300', hex: '#ffcc85' },
      { shade: '400', hex: '#feb551' },
      { shade: '500', hex: '#e99903' },
      { shade: '600', hex: '#aa6701' },
      { shade: '700', hex: '#5f3601' },
      { shade: '800', hex: '#241301' },
    ],
  },
  {
    name: 'Citron',
    shades: [
      { shade: '100', hex: '#fffdf0' },
      { shade: '200', hex: '#fff7c4' },
      { shade: '300', hex: '#f5eb96' },
      { shade: '400', hex: '#eede5c' },
      { shade: '500', hex: '#d2be00' },
      { shade: '600', hex: '#8a8002' },
      { shade: '700', hex: '#50450e' },
      { shade: '800', hex: '#1c1700' },
    ],
  },
  {
    name: 'Lime',
    shades: [
      { shade: '100', hex: '#fbfef0' },
      { shade: '200', hex: '#f1fcc9' },
      { shade: '300', hex: '#e2f29f' },
      { shade: '400', hex: '#cfe363' },
      { shade: '500', hex: '#b3c800' },
      { shade: '600', hex: '#6f7e00' },
      { shade: '700', hex: '#454d0f' },
      { shade: '800', hex: '#1e1900' },
    ],
  },
  {
    name: 'Pear',
    shades: [
      { shade: '100', hex: '#f8fff1' },
      { shade: '200', hex: '#e8fbd5' },
      { shade: '300', hex: '#d1f4aa' },
      { shade: '400', hex: '#b0ea64' },
      { shade: '500', hex: '#91d024' },
      { shade: '600', hex: '#518400' },
      { shade: '700', hex: '#36500d' },
      { shade: '800', hex: '#101d02' },
    ],
  },
  {
    name: 'Green',
    shades: [
      { shade: '100', hex: '#f6fef6' },
      { shade: '200', hex: '#e0fadf' },
      { shade: '300', hex: '#b6f2b5' },
      { shade: '400', hex: '#7eed87' },
      { shade: '500', hex: '#4fd35e' },
      { shade: '600', hex: '#218431' },
      { shade: '700', hex: '#214e20' },
      { shade: '800', hex: '#081e08' },
    ],
  },
  {
    name: 'Aqua',
    shades: [
      { shade: '100', hex: '#f3fdf8' },
      { shade: '200', hex: '#d1faed' },
      { shade: '300', hex: '#9fe7d2' },
      { shade: '400', hex: '#5be2c0' },
      { shade: '500', hex: '#00cca8' },
      { shade: '600', hex: '#1b7e68' },
      { shade: '700', hex: '#024c3d' },
      { shade: '800', hex: '#002119' },
    ],
  },
  {
    name: 'Cyan',
    shades: [
      { shade: '100', hex: '#f1feff' },
      { shade: '200', hex: '#d5f5fb' },
      { shade: '300', hex: '#90ddeb' },
      { shade: '400', hex: '#40cadf' },
      { shade: '500', hex: '#02b3cf' },
      { shade: '600', hex: '#037281' },
      { shade: '700', hex: '#004753' },
      { shade: '800', hex: '#001b20' },
    ],
  },
];

// Pre-compute HSL values for all colors
export const COLOR_HSL_MAP = new Map<string, string>();
for (const family of COLOR_PALETTE) {
  for (const shade of family.shades) {
    COLOR_HSL_MAP.set(shade.hex, hexToHsl(shade.hex));
  }
}

export function resolveHsl(hex: string): string {
  return COLOR_HSL_MAP.get(hex) ?? hexToHsl(hex);
}
