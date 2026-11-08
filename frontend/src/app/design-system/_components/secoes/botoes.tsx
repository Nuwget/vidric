'use client';

import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { cn } from 'cn';
import { Button, buttonVariants } from '@/components/ui/button';
import { ratioEntre } from '../lib/contrast';
import { CodeBlock } from '../code-block';
import { Grupo, ShowcaseSection } from '../showcase-section';

type Variante = 'default' | 'secondary' | 'ghost' | 'destructive';

const VARIANTES: { nome: string; variant: Variante; hover: string; fg: string; bg: string }[] = [
  { nome: 'Primary', variant: 'default', hover: 'bg-primary/80', fg: '#ffffff', bg: '#2e7d32' },
  { nome: 'Secondary', variant: 'secondary', hover: 'bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]', fg: '#1d1d1f', bg: '#f7f7f7' },
  { nome: 'Ghost', variant: 'ghost', hover: 'bg-muted text-foreground', fg: '#1d1d1f', bg: '#ffffff' },
  { nome: 'Destructive', variant: 'destructive', hover: 'bg-[var(--danger)] text-white', fg: '#ad2727', bg: '#f8dede' },
];

const ESTADOS = ['Default', 'Hover', 'Active', 'Focus', 'Disabled'] as const;
type Estado = (typeof ESTADOS)[number];

const FOCUS = 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)] border-[var(--accent)]';

function classeEstado(v: (typeof VARIANTES)[number], estado: Estado): string {
  switch (estado) {
    case 'Hover':
      return v.hover;
    case 'Active':
      return `${v.hover} translate-y-px`;
    case 'Focus':
      return FOCUS;
    default:
      return '';
  }
}

function MatrizEstados() {
  return (
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Matriz de estados dos botões" data-no-contrast>
      <div className="grid min-w-[620px] grid-cols-[120px_repeat(5,minmax(0,1fr))] items-center gap-2">
        <span />
        {ESTADOS.map((e) => (
          <span key={e} className="text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {e}
          </span>
        ))}
        {VARIANTES.map((v) => {
          const ratio = ratioEntre(v.fg, v.bg);
          return (
            <div key={v.nome} className="contents">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold" style={{ color: 'var(--fg)' }}>{v.nome}</span>
                <span
                  className="money self-start rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{
                    background: ratio !== null && ratio >= 4.5 ? 'var(--accent-soft)' : 'var(--warning-soft)',
                    color: ratio !== null && ratio >= 4.5 ? 'var(--accent-text)' : 'var(--warning-text)',
                  }}
                  title={`Contraste texto/fundo da variante: ${ratio?.toFixed(2)}:1`}
                >
                  {ratio?.toFixed(2)}:1
                </span>
              </div>
              {ESTADOS.map((e) => (
                <div key={e} className="flex justify-center">
                  <span
                    data-state={e.toLowerCase()}
                    className={cn(
                      buttonVariants({ variant: v.variant, size: 'sm' }),
                      'cursor-default select-none',
                      classeEstado(v, e),
                      e === 'Disabled' && 'pointer-events-none opacity-50',
                    )}
                  >
                    {v.nome}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SecaoBotoes() {
  return (
    <ShowcaseSection
      id="secao-botoes"
      numero="05 · Componente"
      titulo="Botões"
      descricao="Quatro variantes nos cinco estados, lado a lado. Hover/Active/Focus são classes estáticas (data-state) para inspeção; o focus ring real é 2px accent com offset 2px. O selo mostra o contraste texto/fundo de cada variante."
    >
      <Grupo rotulo="Matriz de estados">
        <MatrizEstados />
        <p className="text-[11px] text-muted-foreground">
          A matriz é ilustrativa (spans com data-state, fora da ordem de tabulação). Primary atende AA
          (≥ 4.5:1); Destructive é texto semântico sobre fundo suave — use para ações de baixo destaque.
        </p>
      </Grupo>

      <Grupo rotulo="Tamanhos">
        <div className="flex flex-wrap items-center gap-2.5">
          <Button type="button" size="sm">Small</Button>
          <Button type="button" size="default">Medium</Button>
          <Button type="button" size="lg">Large</Button>
          <Button type="button" disabled>
            <Loader2 data-icon="inline-start" className="animate-spin" />
            Salvando…
          </Button>
        </div>
      </Grupo>

      <Grupo rotulo="Só ícone (sempre com aria-label)">
        <div className="flex flex-wrap items-center gap-2.5">
          <Button type="button" size="icon" aria-label="Adicionar"><Plus /></Button>
          <Button type="button" size="icon" variant="outline" aria-label="Editar"><Pencil /></Button>
          <Button type="button" size="icon" variant="ghost" aria-label="Fechar"><X /></Button>
          <Button type="button" size="icon" variant="destructive" aria-label="Excluir"><Trash2 /></Button>
        </div>
      </Grupo>

      <CodeBlock
        codigo={`<Button>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
<Button size="sm | default | lg" />
<Button size="icon" aria-label="Adicionar"><Plus /></Button>
/* focus real: outline 2px accent, offset 2px (html.ds-active :focus-visible) */`}
      />
    </ShowcaseSection>
  );
}