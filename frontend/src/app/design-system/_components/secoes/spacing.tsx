'use client';

import { CodeBlock } from '../code-block';
import { Grupo, ShowcaseSection } from '../showcase-section';

interface Passo {
  px: number;
  token: string;
}

/* Escala Tailwind (1 unidade = 4px). 2px é o meio-passo para ícones/bordas. */
const PASSOS: Passo[] = [
  { px: 0, token: '0' },
  { px: 2, token: '0.5' },
  { px: 4, token: '1' },
  { px: 8, token: '2' },
  { px: 12, token: '3' },
  { px: 16, token: '4' },
  { px: 24, token: '6' },
  { px: 32, token: '8' },
  { px: 48, token: '12' },
  { px: 64, token: '16' },
  { px: 96, token: '24' },
];

export function SecaoSpacing() {
  return (
    <ShowcaseSection
      id="secao-spacing"
      numero="03 · Fundação"
      titulo="Spacing"
      descricao="Régua de espaçamento em múltiplos de 4px. A barra tem a largura real do passo; o token Tailwind equivalente aparece ao lado."
    >
      <Grupo rotulo="Escala (1 unidade = 4px)">
        <div className="flex flex-col gap-2">
          {PASSOS.map((p) => (
            <div key={p.token} className="flex items-center gap-3">
              <code className="w-24 shrink-0 font-mono text-[11px]" style={{ color: 'var(--accent-text)' }}>
                space-{p.token}
              </code>
              <div className="flex h-5 min-w-0 flex-1 items-center">
                <div
                  className="h-4 rounded-r-sm"
                  style={{
                    width: `${Math.max(p.px, 2)}px`,
                    background: p.px === 0 ? 'var(--glass-border)' : 'var(--accent)',
                    opacity: p.px === 0 ? 0.6 : 0.85,
                  }}
                />
                <span className="money ml-2 text-[11px] text-muted-foreground">{p.px}px</span>
              </div>
              <code className="hidden w-28 shrink-0 text-right font-mono text-[11px] text-muted-foreground sm:block">
                p-{p.token} · gap-{p.token}
              </code>
            </div>
          ))}
        </div>
      </Grupo>

      <Grupo rotulo="Regra dos múltiplos de 4">
        <p className="text-sm text-muted-foreground">
          Todo espaçamento é múltiplo de <span className="font-semibold" style={{ color: 'var(--fg)' }}>4px</span>:
          4, 8, 12, 16, 24, 32, 48, 64, 96. O passo de <span className="font-semibold" style={{ color: 'var(--fg)' }}>2px</span> é
          a única exceção — meio-passo para ícones, bordas e ajustes finos. Entre seções use 64px (gap-16);
          dentro de um card, 32px (gap-8); entre grupos, 16–24px.
        </p>
      </Grupo>

      <CodeBlock
        codigo={`<main className="flex flex-col gap-16">  {/* 64px entre seções */}
  <article className="flex flex-col gap-8 p-6">  {/* 32px interno */}
    <div className="flex flex-col gap-4">        {/* 16px entre grupos */}
      <div className="flex items-center gap-2">  {/* 8px inline */}
        <Icon className="size-4" />              {/* 16px */}
        <span className="ml-0.5">2px</span>
      </div>
    </div>
  </article>
</main>`}
      />
    </ShowcaseSection>
  );
}