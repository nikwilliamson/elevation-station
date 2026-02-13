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
      { shade: '100', hex: '#f8f8fa' },
      { shade: '200', hex: '#e9edf4' },
      { shade: '300', hex: '#cbd3df' },
      { shade: '400', hex: '#a3adbd' },
      { shade: '500', hex: '#848ea0' },
      { shade: '600', hex: '#5c687b' },
      { shade: '700', hex: '#2d3a4e' },
      { shade: '800', hex: '#0d182c' },
    ],
  },
  {
    name: 'Union',
    shades: [
      { shade: '100', hex: '#f4f8ff' },
      { shade: '200', hex: '#ddeaff' },
      { shade: '300', hex: '#88b3fb' },
      { shade: '400', hex: '#468bff' },
      { shade: '500', hex: '#126bf9' },
      { shade: '600', hex: '#014ebf' },
      { shade: '700', hex: '#033480' },
      { shade: '800', hex: '#061530' },
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
      { shade: '100', hex: '#fff5f4' },
      { shade: '200', hex: '#ffe2e1' },
      { shade: '300', hex: '#ff9fa0' },
      { shade: '400', hex: '#fc6a67' },
      { shade: '500', hex: '#ed3533' },
      { shade: '600', hex: '#a82a21' },
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
    name: 'Yellow',
    shades: [
      { shade: '100', hex: '#fffcf2' },
      { shade: '200', hex: '#fff1c9' },
      { shade: '300', hex: '#f9de8c' },
      { shade: '400', hex: '#fac952' },
      { shade: '500', hex: '#ecb406' },
      { shade: '600', hex: '#a17a00' },
      { shade: '700', hex: '#574009' },
      { shade: '800', hex: '#221600' },
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
