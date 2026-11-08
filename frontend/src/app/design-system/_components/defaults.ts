import {
  CORES_DEFAULTS,
  CORES_VARS,
  buildCoresCss,
  clonarCores,
  derivarCores,
  normalizarCores,
  type DsCores,
} from './lib/cores';

export type Sombra = 'none' | 'soft' | 'medium' | 'strong';
export type Tema = 'light' | 'dark';

export interface DsConfig {
  glassOpacity: number;
  glassBlur: number;
  glassSaturate: number;
  radius: number;
  borderWidth: number;
  shadow: Sombra;
  specular: number;
  theme: Tema;
  showCode: boolean;
  fontScale: number;
  reducedMotion: boolean;
  highContrast: boolean;
  cores: DsCores;
}

/*
  Defaults derivados de theme-playground/index.html (DEFAULTS + apply()):
  glassOpacity .38, glassBlur 44, radius 16; --glass-sat 190% e o specular
  inset .75 (light) / .35 (dark) vêm do globals.css, que copia o playground.
  As cores base (CORES_DEFAULTS) também são do playground; com os pickers do
  painel elas só sobrescrevem em runtime (inline no :root desta rota). Aprovou
  um resultado? Exportar CSS vars → playground → globals.css manualmente.
*/
export const DS_DEFAULTS: DsConfig = {
  glassOpacity: 0.38,
  glassBlur: 44,
  glassSaturate: 1.9,
  radius: 16,
  borderWidth: 1,
  shadow: 'medium',
  specular: 1,
  theme: 'dark',
  showCode: true,
  fontScale: 100,
  reducedMotion: false,
  highContrast: false,
  cores: clonarCores(CORES_DEFAULTS),
};

export const DS_STORAGE_KEY = 'vidric.design-system.config';
export const DS_SNAPSHOTS_KEY = 'vidric.design-system.snapshots';

/** Disparado por aplicarConfig() com o DsConfig no detail — as seções re-leem os tokens. */
export const EVENTO_DS_CONFIG = 'vidric:ds-config';

export type Snapshots = Record<string, DsConfig>;

const arredondar = (a: number) => Math.round(a * 10000) / 10000;
const rgba = (r: number, g: number, b: number, a: number) =>
  `rgba(${r}, ${g}, ${b}, ${arredondar(a)})`;

/* Espelha o apply() do playground para as vars que o .glass realmente consome. */
export function aplicarConfig(c: DsConfig): void {
  const d = document.documentElement.style;
  const dk = c.theme === 'dark';
  const set = (k: string, v: string) => d.setProperty(k, v);

  const gAlpha = dk ? c.glassOpacity * 0.22 : c.glassOpacity;
  set('--glass-bg', rgba(255, 255, 255, gAlpha));
  set('--glass-bg-deep', rgba(255, 255, 255, dk ? gAlpha * 0.55 : Math.min(gAlpha + 0.02, 0.5)));
  set('--glass-bg-thin', rgba(255, 255, 255, dk ? gAlpha * 0.72 : gAlpha * 0.68));
  set('--glass-blur', `${c.glassBlur}px`);
  set('--glass-sat', `${Math.round(c.glassSaturate * 100)}%`);
  set('--radius', `${c.radius}px`);
  set('--glass-border-width', `${c.borderWidth}px`);

  // playground: sombra escura usa mix(accent, #7850B4, .5) = rgb(83,103,115)
  const tint: [number, number, number] = dk ? [83, 103, 115] : [46, 125, 50];
  const externas: Record<Sombra, string> = {
    none: '',
    soft: `0 4px 16px ${rgba(...tint, dk ? 0.12 : 0.06)}`,
    medium: `0 8px 32px ${rgba(...tint, dk ? 0.2 : 0.1)}`,
    strong: `0 16px 48px ${rgba(...tint, dk ? 0.36 : 0.18)}`,
  };
  const partes = [
    `inset 0 1px 0 ${rgba(255, 255, 255, (dk ? 0.35 : 0.75) * c.specular)}`,
    `inset 0 -1px 0 ${dk ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)'}`,
  ];
  if (externas[c.shadow]) partes.push(externas[c.shadow]);
  set('--shadow-glass', partes.join(', '));
  set('--shadow-hover', c.shadow === 'none' ? 'none' : `0 10px 28px ${rgba(...tint, dk ? 0.28 : 0.14)}`);

  document.documentElement.dataset.theme = c.theme;

  // Cores base: mesma derivação do apply() do playground, recalculada no ato.
  for (const [k, v] of Object.entries(derivarCores(c.cores, c.theme))) set(k, v);

  // Acessibilidade: zoom real (rem), movimento e contraste reduzidos simulados.
  // As media queries reais têm o mesmo efeito via CSS escopado no shell.
  document.documentElement.style.fontSize = c.fontScale === 100 ? '' : `${c.fontScale}%`;
  document.documentElement.dataset.reducedMotion = String(c.reducedMotion);
  document.documentElement.dataset.contrast = c.highContrast ? 'more' : 'normal';

  window.dispatchEvent(new CustomEvent(EVENTO_DS_CONFIG, { detail: c }));
}

export function limparConfigAplicada(): void {
  const html = document.documentElement;
  html.style.fontSize = '';
  delete html.dataset.reducedMotion;
  delete html.dataset.contrast;
  // Remove os vars inline para não vazar no app ao sair da rota (o globals.css
  // volta a valer). data-theme fica por conta do app.
  for (const k of [
    '--glass-bg',
    '--glass-bg-deep',
    '--glass-bg-thin',
    '--glass-blur',
    '--glass-sat',
    '--radius',
    '--glass-border-width',
    '--shadow-glass',
    '--shadow-hover',
    ...CORES_VARS,
  ]) {
    html.style.removeProperty(k);
  }
}

export function buildExportCss(c: DsConfig): string {
  const cs = getComputedStyle(document.documentElement);
  const vars = [
    '--glass-bg',
    '--glass-bg-deep',
    '--glass-bg-thin',
    '--glass-blur',
    '--glass-sat',
    '--glass-bright',
    '--glass-border-width',
    '--shadow-glass',
    '--shadow-hover',
    '--radius',
  ];
  const linhas = vars.map((k) => `  ${k}: ${cs.getPropertyValue(k).trim()};`).join('\n');
  const notaBorda =
    c.borderWidth !== 1
      ? '\n  /* --glass-border-width precisa de .glass { border-width: var(--glass-border-width); } no globals.css */'
      : '';
  const vidro = `/* Design System — Vidric · tema ${c.theme} · valores computados em /design-system (dev) */\n:root {\n${linhas}${notaBorda}\n}`;
  return `${vidro}\n\n${buildCoresCss(c.cores)}`;
}

export function lerConfig(): DsConfig {
  try {
    const s = JSON.parse(localStorage.getItem(DS_STORAGE_KEY) ?? 'null');
    if (!s) return { ...DS_DEFAULTS, cores: clonarCores(CORES_DEFAULTS) };
    return { ...DS_DEFAULTS, ...s, cores: normalizarCores(s.cores) };
  } catch {
    return { ...DS_DEFAULTS, cores: clonarCores(CORES_DEFAULTS) };
  }
}

export function salvarConfig(c: DsConfig): void {
  localStorage.setItem(DS_STORAGE_KEY, JSON.stringify(c));
}

export function lerSnapshots(): Snapshots {
  try {
    const s = JSON.parse(localStorage.getItem(DS_SNAPSHOTS_KEY) ?? 'null');
    return s && typeof s === 'object' ? s : {};
  } catch {
    return {};
  }
}

export function salvarSnapshots(s: Snapshots): void {
  localStorage.setItem(DS_SNAPSHOTS_KEY, JSON.stringify(s));
}