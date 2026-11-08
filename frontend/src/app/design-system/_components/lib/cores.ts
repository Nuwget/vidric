import type { Tema } from '../defaults';

/*
  Derivação de cores base — espelho 1:1 do apply() de theme-playground/index.html
  (linhas 260-298). O playground é a fonte de verdade; este módulo só recalcula,
  para a /design-system poder mostrar os tokens ao vivo enquanto o dev move um
  color picker. Nada aqui escreve no playground nem no globals.css.
*/

export interface DsCores {
  /** --accent e derivados (botões, foco, links). */
  accent: string;
  /** --danger e derivados (ações destrutivas, erros). */
  error: string;
  /** --warning e derivados (avisos, saldo em aberto). */
  warning: string;
  /** --fg por tema. */
  fg: { light: string; dark: string };
  /** --bg por tema (também alimenta --surface, --muted e os soft). */
  bg: { light: string; dark: string };
}

/* Defaults = DEFAULTS do playground (accent verde Vidric #2E7D32). */
export const CORES_DEFAULTS: DsCores = {
  accent: '#2e7d32',
  error: '#d32f2f',
  warning: '#f9a825',
  fg: { light: '#1d1d1f', dark: '#f5f5f7' },
  bg: { light: '#ffffff', dark: '#0b0b12' },
};

const clamp255 = (v: number) => Math.min(255, Math.max(0, v));

function hex2rgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mistura linear entre dois hexes: t = 0 devolve h1, t = 1 devolve h2. */
export function mix(h1: string, h2: string, t: number): string {
  const a = hex2rgb(h1);
  const b = hex2rgb(h2);
  return (
    '#' +
    a.map((v, i) => Math.round(clamp255(v * (1 - t) + b[i] * t)).toString(16).padStart(2, '0')).join('')
  );
}

export const lighten = (hex: string, t: number) => mix(hex, '#ffffff', t);
export const darken = (hex: string, t: number) => mix(hex, '#000000', t);

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hex2rgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Luminância relativa WCAG (0-1) — mesma fórmula do playground. */
export function lum(hex: string): number {
  const canais = hex2rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2];
}

export type TokensDerivados = Record<string, string>;

/** Calcula todos os tokens derivados dos 5 inputs, para um tema. */
export function derivarCores(c: DsCores, tema: Tema): TokensDerivados {
  const dk = tema === 'dark';
  const base = dk ? c.bg.dark : c.bg.light;
  return {
    '--accent': c.accent,
    '--accent-brand': dk ? lighten(c.accent, 0.42) : c.accent,
    '--accent-text': dk ? lighten(c.accent, 0.42) : darken(c.accent, 0.12),
    '--accent-strong': darken(c.accent, 0.12),
    '--accent-soft': mix(c.accent, base, 0.86),
    '--accent-glass': rgba(c.accent, 0.85),
    '--on-accent': lum(c.accent) > 0.62 ? '#111417' : '#ffffff',
    '--danger': c.error,
    '--danger-text': dk ? lighten(c.error, 0.45) : darken(c.error, 0.18),
    '--danger-soft': mix(c.error, base, 0.84),
    '--warning': c.warning,
    '--warning-text': dk ? lighten(c.warning, 0.3) : darken(c.warning, 0.47),
    '--warning-soft': mix(c.warning, base, 0.82),
    '--bg': base,
    '--fg': dk ? c.fg.dark : c.fg.light,
    '--surface': dk ? lighten(c.bg.dark, 0.07) : darken(c.bg.light, 0.03),
    '--muted': dk ? mix(c.fg.dark, c.bg.dark, 0.26) : mix(c.fg.light, c.bg.light, 0.32),
  };
}

/** Lista dos vars que derivarCores escreve — serve para limpar e para o export. */
export const CORES_VARS: string[] = Object.keys(derivarCores(CORES_DEFAULTS, 'light'));

const hexValido = (v: unknown, fallback: string) =>
  typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim()) ? v.trim() : fallback;

/** Aceita configs antigas/incompletas do localStorage sem quebrar o painel. */
export function normalizarCores(bruto: unknown): DsCores {
  const c = (bruto ?? {}) as Partial<Record<keyof DsCores, unknown>>;
  const par = (v: unknown, padrao: { light: string; dark: string }) => {
    const p = (v ?? {}) as Partial<{ light: string; dark: string }>;
    return { light: hexValido(p.light, padrao.light), dark: hexValido(p.dark, padrao.dark) };
  };
  return {
    accent: hexValido(c.accent, CORES_DEFAULTS.accent),
    error: hexValido(c.error, CORES_DEFAULTS.error),
    warning: hexValido(c.warning, CORES_DEFAULTS.warning),
    fg: par(c.fg, CORES_DEFAULTS.fg),
    bg: par(c.bg, CORES_DEFAULTS.bg),
  };
}

export function clonarCores(c: DsCores): DsCores {
  return { accent: c.accent, error: c.error, warning: c.warning, fg: { ...c.fg }, bg: { ...c.bg } };
}

/** Bloco de tokens base pronto para colar no globals.css (light em :root, dark por atributo). */
export function buildCoresCss(c: DsCores): string {
  const bloco = (tema: Tema, seletor: string, comentario: string) => {
    const linhas = Object.entries(derivarCores(c, tema))
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');
    return `/* tokens base · ${comentario} */\n${seletor} {\n${linhas}\n}`;
  };
  return `${bloco('light', ':root', 'light')}\n\n${bloco('dark', "[data-theme='dark']", 'dark')}`;
}
