'use client';

import { compositeOver, parseColor, ratioEntre, toHex, toOklch } from '../lib/contrast';
import { CodeBlock } from '../code-block';
import { Grupo, ShowcaseSection } from '../showcase-section';

/* Tokens espelhados de globals.css (fonte: theme-playground). A página só LÊ —
   hex/OKLCH/contraste são calculados ao vivo pela lib de contraste WCAG. */
interface Token {
  var: string;
  light: string;
  dark: string;
  uso: string;
  texto?: boolean;
}

const TOKENS: Token[] = [
  { var: '--fg', light: '#1d1d1f', dark: '#f5f5f7', uso: 'Texto principal', texto: true },
  { var: '--muted', light: '#7c7c7d', dark: '#b8b8bb', uso: 'Texto secundário', texto: true },
  { var: '--accent-text', light: '#2e7d32', dark: '#86b488', uso: 'Links e destaques', texto: true },
  { var: '--danger-text', light: '#d32f2f', dark: '#dd5d5d', uso: 'Mensagens de erro', texto: true },
  { var: '--warning-text', light: '#8e6015', dark: '#fbc266', uso: 'Alertas', texto: true },
  { var: '--on-accent', light: '#ffffff', dark: '#ffffff', uso: 'Texto sobre o accent', texto: true },
  { var: '--accent', light: '#2e7d32', dark: '#2e7d32', uso: 'Botão primary / foco' },
  { var: '--accent-strong', light: '#286e2c', dark: '#286e2c', uso: 'Hover do primary' },
  { var: '--danger', light: '#d32f2f', dark: '#d32f2f', uso: 'Ações destrutivas' },
  { var: '--warning', light: '#f9a825', dark: '#f9a825', uso: 'Avisos' },
  { var: '--bg', light: '#ffffff', dark: '#0b0b12', uso: 'Fundo da página' },
  { var: '--surface', light: '#f7f7f7', dark: '#1c1c23', uso: 'Cards sólidos' },
  { var: '--glass-bg', light: 'rgba(255, 255, 255, 0.38)', dark: 'rgba(255, 255, 255, 0.08)', uso: 'Painéis de vidro' },
  { var: '--glass-border', light: 'rgba(0, 0, 0, 0.14)', dark: 'rgba(255, 255, 255, 0.14)', uso: 'Bordas do vidro' },
  { var: '--accent-soft', light: 'rgba(46, 125, 50, 0.14)', dark: 'rgba(46, 125, 50, 0.14)', uso: 'Realce suave / hover' },
  { var: '--danger-soft', light: 'rgba(211, 47, 47, 0.16)', dark: 'rgba(211, 47, 47, 0.16)', uso: 'Fundo de erro' },
  { var: '--warning-soft', light: 'rgba(249, 168, 37, 0.18)', dark: 'rgba(249, 168, 37, 0.18)', uso: 'Fundo de aviso' },
];

const FUNDO = { light: '#ffffff', dark: '#0b0b12' } as const;

function Swatch({ valor, fundo, rotulo }: { valor: string; fundo: string; rotulo: string }) {
  const rgba = parseColor(valor);
  const bg = parseColor(fundo);
  const solid = rgba && bg ? compositeOver(rgba, bg) : null;
  const hex = solid ? toHex(solid) : '—';
  const oklch = solid ? toOklch(solid) : '—';
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <div
        className="h-14 w-full rounded-lg border"
        style={{ background: fundo, borderColor: 'var(--glass-border)' }}
      >
        <div className="size-full rounded-lg" style={{ background: valor }} />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{rotulo}</p>
      <p className="money truncate font-mono text-[11px]" style={{ color: 'var(--fg)' }}>{hex}</p>
      <p className="money truncate font-mono text-[10px] text-muted-foreground" title={oklch}>{oklch}</p>
    </div>
  );
}

function SeloContraste({ ratio }: { ratio: number | null }) {
  if (ratio === null) return null;
  if (ratio >= 4.5) {
    return (
      <span data-no-contrast className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}>
        AA ✓
      </span>
    );
  }
  return (
    <span data-no-contrast className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'var(--danger-soft)', color: 'var(--danger-text)' }}>
      {ratio >= 3 ? 'Somente texto grande' : 'Reprovado'}
    </span>
  );
}

function TokenCard({ token }: { token: Token }) {
  const ratioLight = ratioEntre(token.light, FUNDO.light);
  const ratioDark = ratioEntre(token.dark, FUNDO.dark);
  return (
    <div className="glass-card flex flex-col gap-3 p-4" data-contrast-nome={token.var}>
      <div className="flex items-baseline justify-between gap-2">
        <code className="font-mono text-xs font-semibold" style={{ color: 'var(--accent-text)' }}>{token.var}</code>
        <span className="text-[11px] text-muted-foreground">{token.uso}</span>
      </div>
      <div className="flex gap-3">
        <Swatch valor={token.light} fundo={FUNDO.light} rotulo="Light" />
        <Swatch valor={token.dark} fundo={FUNDO.dark} rotulo="Dark" />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2.5 text-[11px]" style={{ borderColor: 'var(--glass-border)' }}>
        <span className="money text-muted-foreground">
          vs fundo: <span style={{ color: 'var(--fg)' }}>{ratioLight?.toFixed(2) ?? '—'}:1</span> light ·{' '}
          <span style={{ color: 'var(--fg)' }}>{ratioDark?.toFixed(2) ?? '—'}:1</span> dark
        </span>
        {token.texto && (
          <span className="ml-auto flex items-center gap-1.5">
            <SeloContraste ratio={ratioLight} />
            <SeloContraste ratio={ratioDark} />
          </span>
        )}
      </div>
    </div>
  );
}

export function SecaoColors() {
  return (
    <ShowcaseSection
      id="secao-colors"
      numero="01 · Fundação"
      titulo="Colors"
      descricao="Tokens semânticos do Vidric em light e dark. Hex e OKLCH calculados ao vivo; contraste WCAG AA versus o fundo da página. Tokens de texto abaixo de 4.5:1 são sinalizados."
    >
      <Grupo rotulo="Paleta semântica">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TOKENS.map((t) => (
            <TokenCard key={t.var} token={t} />
          ))}
        </div>
      </Grupo>

      <Grupo rotulo="Regra de contraste">
        <p className="text-sm text-muted-foreground">
          Texto normal exige <span className="font-semibold" style={{ color: 'var(--fg)' }}>≥ 4.5:1</span>;
          texto grande (≥ 24px ou ≥ 18.66px bold) exige <span className="font-semibold" style={{ color: 'var(--fg)' }}>≥ 3:1</span>.
          O verde Vidric <code className="font-mono text-xs">#2E7D32</code> é a identidade — sobre fundo claro
          passa como texto normal; no dark o <code className="font-mono text-xs">--accent-text</code> clareia
          para <code className="font-mono text-xs">#86B488</code> para manter a leitura.
        </p>
      </Grupo>

      <CodeBlock
        codigo={`:root {
  --accent: #2e7d32;        /* identidade Vidric */
  --accent-text: #2e7d32;   /* light */
  --fg: #1d1d1f;
  --muted: #7c7c7d;
}
[data-theme='dark'] {
  --accent-text: #86b488;   /* clareia p/ contraste */
  --fg: #f5f5f7;
  --muted: #b8b8bb;
}`}
      />
    </ShowcaseSection>
  );
}