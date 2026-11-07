'use client';

import { CodeBlock } from '../code-block';
import { Grupo, ShowcaseSection } from '../showcase-section';

interface Estilo {
  nome: string;
  classe: string;
  px: number;
  lineHeight: string;
  peso: number;
  tracking: string;
  mono?: boolean;
  amostra?: string;
}

const ESCALA: Estilo[] = [
  { nome: 'Display', classe: 'text-5xl', px: 48, lineHeight: '1', peso: 700, tracking: '-0.02em', amostra: 'Vidric' },
  { nome: 'H1', classe: 'text-[32px]', px: 32, lineHeight: '1.2', peso: 700, tracking: '-0.02em' },
  { nome: 'H2', classe: 'text-2xl', px: 24, lineHeight: '1.33', peso: 600, tracking: '-0.02em' },
  { nome: 'H3', classe: 'text-xl', px: 20, lineHeight: '1.4', peso: 600, tracking: '-0.01em' },
  { nome: 'Body', classe: 'text-base', px: 16, lineHeight: '1.5', peso: 400, tracking: '-0.005em' },
  { nome: 'Body SM', classe: 'text-sm', px: 14, lineHeight: '1.43', peso: 400, tracking: '-0.005em' },
  { nome: 'Caption', classe: 'text-xs', px: 12, lineHeight: '1.33', peso: 500, tracking: '0' },
  { nome: 'Mono', classe: 'font-mono text-sm', px: 14, lineHeight: '1.43', peso: 400, tracking: '0', mono: true, amostra: 'SKU-0042 · R$ 39,90' },
];

const AMOSTRA = 'Capinha iPhone 15 Preta — R$ 39,90';

function LinhaEscala({ e }: { e: Estilo }) {
  return (
    <div className="glass-card flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-6">
      <div className="min-w-0 flex-1">
        <p
          className={e.mono ? 'font-mono' : undefined}
          style={{
            fontSize: `${e.px}px`,
            lineHeight: e.lineHeight,
            fontWeight: e.peso,
            letterSpacing: e.tracking,
            color: 'var(--fg)',
          }}
        >
          {e.amostra ?? AMOSTRA}
        </p>
      </div>
      <dl className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-1 text-[11px] md:w-56 md:grid-cols-1">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Classe</dt>
          <dd className="font-mono" style={{ color: 'var(--accent-text)' }}>{e.classe}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Tamanho</dt>
          <dd className="money" style={{ color: 'var(--fg)' }}>{e.px}px / {e.lineHeight}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Peso</dt>
          <dd className="money" style={{ color: 'var(--fg)' }}>{e.peso}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Tracking</dt>
          <dd className="money" style={{ color: 'var(--fg)' }}>{e.tracking}</dd>
        </div>
        {e.px < 12 && (
          <div className="col-span-2 md:col-span-1">
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'var(--danger-soft)', color: 'var(--danger-text)' }}>
              Abaixo de 12px — evitar
            </span>
          </div>
        )}
      </dl>
    </div>
  );
}

export function SecaoTypography() {
  return (
    <ShowcaseSection
      id="secao-typography"
      numero="02 · Fundação"
      titulo="Typography"
      descricao="Escala Geist Sans (e Geist Mono para código). Títulos com tracking-tight; preços e números com tabular-nums. Caption de 12px é o piso legível."
    >
      <Grupo rotulo="Escala tipográfica">
        <div className="flex flex-col gap-3">
          {ESCALA.map((e) => (
            <LinhaEscala key={e.nome} e={e} />
          ))}
        </div>
      </Grupo>

      <Grupo rotulo="Tabular-nums para dinheiro">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="glass-card flex flex-col gap-2 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Proporcional</p>
            <div className="flex flex-col gap-1 text-lg" style={{ color: 'var(--fg)', fontVariantNumeric: 'proportional-nums' }}>
              <span>R$ 1.234,56</span>
              <span>R$ 99,90</span>
              <span>R$ 1.000.000,00</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Dígitos de larguras diferentes — desalinha em colunas.</p>
          </div>
          <div className="glass-card flex flex-col gap-2 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--accent-text)' }}>Tabular (.money)</p>
            <div className="money flex flex-col gap-1 text-lg" style={{ color: 'var(--fg)' }}>
              <span>R$ 1.234,56</span>
              <span>R$ 99,90</span>
              <span>R$ 1.000.000,00</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Largura fixa por dígito — vírgulas alinhadas. Use em todo valor.</p>
          </div>
        </div>
      </Grupo>

      <CodeBlock
        codigo={`<h1 className="text-[32px] font-bold tracking-tight">Título</h1>
<p className="text-base leading-relaxed">Corpo de texto.</p>
<span className="money text-lg">R$ 1.234,56</span>
<code className="font-mono text-sm">SKU-0042</code>
/* .money { font-variant-numeric: tabular-nums; } */`}
      />
    </ShowcaseSection>
  );
}