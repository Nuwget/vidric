/*
  Matemática de cor WCAG 2.x para a auditoria da /design-system.
  Parseia os formatos que o getComputedStyle devolve (hex, rgb/rgba, oklch,
  color(srgb)) — o Chrome computa os tokens oklch do playground como oklch().
  Compõe alpha sobre o fundo e calcula luminância relativa + ratio.
*/

export interface RGBA {
  r: number; // 0-255
  g: number;
  b: number;
  a: number; // 0-1
}

const clamp = (v: number, min = 0, max = 255) => Math.min(max, Math.max(min, v));

function srgbGamma(c: number): number {
  const v = clamp(c, 0, 1);
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

function oklchToRgb(L: number, C: number, H: number): [number, number, number] {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const R = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const B = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [srgbGamma(R) * 255, srgbGamma(G) * 255, srgbGamma(B) * 255];
}

export function parseColor(input: string): RGBA | null {
  const s = input.trim().toLowerCase();
  if (!s || s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      const a = hex.length === 4 ? parseInt(hex[3] + hex[3], 16) / 255 : 1;
      return { r, g, b, a };
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
      return { r, g, b, a };
    }
    return null;
  }

  const fn = s.match(/^(rgb|rgba|oklch|color)\(([^)]+)\)$/);
  if (fn) {
    const tipo = fn[1];
    const args = fn[2].replace(/\//g, ' ').split(/[\s,]+/).filter(Boolean);
    const alpha = args.length > 3 && tipo !== 'color' ? parseFloat(args[3]) : args.length > 3 ? parseFloat(args[3]) : 1;
    if (tipo === 'rgb' || tipo === 'rgba') {
      const num = (v: string) => (v.endsWith('%') ? (parseFloat(v) / 100) * 255 : parseFloat(v));
      return { r: clamp(num(args[0])), g: clamp(num(args[1])), b: clamp(num(args[2])), a: isNaN(alpha) ? 1 : alpha };
    }
    if (tipo === 'oklch') {
      const L = args[0].endsWith('%') ? parseFloat(args[0]) / 100 : parseFloat(args[0]);
      const C = parseFloat(args[1]);
      const H = parseFloat(args[2]);
      const [r, g, b] = oklchToRgb(L, C, H);
      const a = args[3] !== undefined ? (args[3].endsWith('%') ? parseFloat(args[3]) / 100 : parseFloat(args[3])) : 1;
      return { r: clamp(r), g: clamp(g), b: clamp(b), a: isNaN(a) ? 1 : a };
    }
    if (tipo === 'color') {
      // color(srgb r g b [/ a]) — valores 0-1 já gamma-encoded
      const off = args[0] === 'srgb' ? 1 : 0;
      const a = args[off + 3] !== undefined ? parseFloat(args[off + 3]) : 1;
      return {
        r: clamp(parseFloat(args[off]) * 255),
        g: clamp(parseFloat(args[off + 1]) * 255),
        b: clamp(parseFloat(args[off + 2]) * 255),
        a: isNaN(a) ? 1 : a,
      };
    }
  }
  return null;
}

/** Compõe fg (com alpha) sobre bg opaco → cor opaca resultante. */
export function compositeOver(fg: RGBA, bg: RGBA): RGBA {
  const a = fg.a + bg.a * (1 - fg.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  return {
    r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
    g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
    b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
    a,
  };
}

export function relativeLuminance({ r, g, b }: RGBA): number {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(fg: RGBA, bg: RGBA): number {
  const f = compositeOver(fg, bg);
  const l1 = relativeLuminance(f);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Ratio entre duas strings de cor computadas; null se não parseável. */
export function ratioEntre(fgStr: string, bgStr: string): number | null {
  const fg = parseColor(fgStr);
  const bg = parseColor(bgStr);
  if (!fg || !bg) return null;
  return Math.round(contrastRatio(fg, bg) * 100) / 100;
}

export function toHex({ r, g, b }: RGBA): string {
  const h = (v: number) => Math.round(clamp(v)).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

export function toOklch({ r, g, b }: RGBA): string {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const R = lin(r);
  const G = lin(g);
  const B = lin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.sqrt(a * a + bb * bb);
  let H = (Math.atan2(bb, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`;
}

export interface ParContraste {
  nome: string;
  fg: string;
  bg: string;
  ratio: number | null;
  large?: boolean;
  passa: boolean;
}

export function avaliarPar(nome: string, fgStr: string, bgStr: string, large = false): ParContraste {
  const ratio = ratioEntre(fgStr, bgStr);
  const minimo = large ? 3 : 4.5;
  return { nome, fg: fgStr, bg: bgStr, ratio, large, passa: ratio !== null && ratio >= minimo };
}