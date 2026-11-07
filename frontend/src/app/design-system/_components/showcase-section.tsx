import type { ReactNode } from 'react';

interface Props {
  id: string;
  numero?: string;
  titulo: string;
  descricao: string;
  children: ReactNode;
}

/* Cada seção é um <article> com H2 próprio (hierarquia correta para axe e
   leitores de tela). gap-8 interno; o gap-16 entre seções vem do <main>. */
export function ShowcaseSection({ id, numero, titulo, descricao, children }: Props) {
  return (
    <article id={id} data-testid={id} className="glass flex scroll-mt-36 flex-col gap-8 p-5 md:p-7">
      <header className="flex flex-col gap-1.5">
        {numero && (
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: 'var(--accent-text)' }}
          >
            {numero}
          </span>
        )}
        <h2 className="text-2xl font-semibold tracking-tight">{titulo}</h2>
        <p className="text-sm text-muted-foreground">{descricao}</p>
      </header>
      {children}
    </article>
  );
}

export function Grupo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {rotulo}
      </h3>
      {children}
    </div>
  );
}