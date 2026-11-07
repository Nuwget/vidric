'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, CircleCheck, CircleX, Info, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CodeBlock } from '../code-block';
import { Grupo, ShowcaseSection } from '../showcase-section';

function Semantico({
  bg,
  cor,
  children,
}: {
  bg: string;
  cor: string;
  children: ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 self-start rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: bg, color: cor }}
    >
      {children}
    </span>
  );
}

export function SecaoBadges() {
  return (
    <ShowcaseSection
      id="secao-badges"
      numero="09 · Componente"
      titulo="Badges"
      descricao="Tokens semânticos do playground (accent/danger/warning). Info e neutro usam superfície — não há token --info."
    >
      <Grupo rotulo="Semânticos">
        <div className="flex flex-wrap items-center gap-2">
          <Semantico bg="var(--accent-soft)" cor="var(--accent-text)">Sucesso</Semantico>
          <Semantico bg="var(--danger-soft)" cor="var(--danger-text)">Erro</Semantico>
          <Semantico bg="var(--warning-soft)" cor="var(--warning-text)">Warning</Semantico>
          <Semantico bg="var(--surface)" cor="var(--fg)">Info</Semantico>
          <Semantico bg="var(--surface)" cor="var(--muted)">Neutro</Semantico>
        </div>
      </Grupo>

      <Grupo rotulo="Com ícone">
        <div className="flex flex-wrap items-center gap-2">
          <Semantico bg="var(--accent-soft)" cor="var(--accent-text)"><CircleCheck className="size-3" aria-hidden /> Pago</Semantico>
          <Semantico bg="var(--danger-soft)" cor="var(--danger-text)"><CircleX className="size-3" aria-hidden /> Esgotado</Semantico>
          <Semantico bg="var(--warning-soft)" cor="var(--warning-text)"><AlertTriangle className="size-3" aria-hidden /> Abaixo do mínimo</Semantico>
          <Semantico bg="var(--surface)" cor="var(--fg)"><Info className="size-3" aria-hidden /> Parcial</Semantico>
          <Semantico bg="var(--surface)" cor="var(--muted)"><Minus className="size-3" aria-hidden /> Inativo</Semantico>
        </div>
      </Grupo>

      <Grupo rotulo="Badge shadcn (primitiva)">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="ghost">Ghost</Badge>
        </div>
      </Grupo>

      <CodeBlock
        codigo={`// badge do app: tokens semânticos, pílula
<span
  className="text-[10px] px-2 py-0.5 rounded-full self-start font-semibold"
  style={{ background: 'var(--danger-soft)', color: 'var(--danger-text)' }}
>
  Abaixo do mínimo
</span>

<Badge variant="secondary">Secondary</Badge>`}
      />
    </ShowcaseSection>
  );
}