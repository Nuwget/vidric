import type { ReactNode } from 'react';

interface Props {
  id: string;
  numero: string;
  titulo: string;
  descricao: string;
  children: ReactNode;
}

export function ShowcaseSection({ id, numero, titulo, descricao, children }: Props) {
  return (
    <section id={id} data-testid={id} className="glass flex scroll-mt-32 flex-col gap-5 p-5 md:p-6">
      <header className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <span
            className="grid size-6 place-items-center rounded-full text-[11px] font-bold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}
          >
            {numero}
          </span>
          <h2 className="text-lg font-semibold tracking-[-0.022em]">{titulo}</h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {descricao}
        </p>
      </header>
      {children}
    </section>
  );
}

export function Grupo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>
        {rotulo}
      </p>
      {children}
    </div>
  );
}