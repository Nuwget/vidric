'use client';

import { Inbox, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CodeBlock } from '../code-block';
import { Grupo, ShowcaseSection } from '../showcase-section';

export function SecaoEstados() {
  return (
    <ShowcaseSection
      id="secao-estados"
      numero="10"
      titulo="Estados vazios e loading"
      descricao="Empty state com CTA, skeletons de card/lista e spinner inline. O skeleton de tabela está na seção 08."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Grupo rotulo="Empty state">
          <div className="glass-card flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <span
              className="grid size-12 place-items-center rounded-full"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}
            >
              <Inbox className="size-5" />
            </span>
            <p className="font-semibold">Sem vendas hoje</p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              As vendas do PDV aparecem aqui assim que a primeira for fechada.
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-2"
              onClick={() => toast.info('O PDV fica em /pdv (fora desta página).')}
            >
              Abrir PDV
            </Button>
          </div>
        </Grupo>

        <Grupo rotulo="Skeleton de card">
          <div className="glass-card flex h-full flex-col gap-2.5 p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="mt-1 h-6 w-1/2" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </Grupo>

        <Grupo rotulo="Skeleton de lista + spinner">
          <div className="glass-card flex h-full flex-col gap-3 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
            <div className="mt-1 flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
              <Loader2 className="size-4 animate-spin" />
              Carregando produtos…
            </div>
          </div>
        </Grupo>
      </div>

      <CodeBlock
        codigo={`<Skeleton className="h-4 w-2/3" />
<Skeleton className="size-10 rounded-full" />

<Loader2 className="size-4 animate-spin" /> {/* spinner inline */}

// empty state: ícone + título + descrição + CTA
<div className="glass-card p-6 text-center flex flex-col items-center gap-2">…</div>`}
      />
    </ShowcaseSection>
  );
}