'use client';

import { forwardRef } from 'react';
import { Menu, RotateCcw, Copy, Search, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface Props {
  secaoAtual: string;
  busca: string;
  onBusca: (v: string) => void;
  onReset: () => void;
  onExport: () => void;
  mobile: boolean;
  onAbrirNav: () => void;
  a11yPassando: number;
  a11yTotal: number;
  criticoSerio: number;
  onIrParaAuditoria: () => void;
}

export const DsTopbar = forwardRef<HTMLInputElement, Props>(function DsTopbar(
  {
    secaoAtual,
    busca,
    onBusca,
    onReset,
    onExport,
    mobile,
    onAbrirNav,
    a11yPassando,
    a11yTotal,
    criticoSerio,
    onIrParaAuditoria,
  },
  searchRef,
) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-3">
        {mobile && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            data-testid="abrir-nav"
            aria-label="Abrir navegação de seções"
            onClick={onAbrirNav}
            className="bg-transparent"
          >
            <Menu />
          </Button>
        )}
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="text-xs sm:text-sm">
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="text-muted-foreground">Vidric</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Design System</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage data-testid="breadcrumb-secao" className="font-medium text-[var(--accent-text)]">
                {secaoAtual}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" data-testid="botao-reset" onClick={onReset}>
            <RotateCcw data-icon="inline-start" />
            Reset
          </Button>
          <Button type="button" size="sm" data-testid="botao-exportar-css" onClick={onExport}>
            <Copy data-icon="inline-start" />
            Exportar CSS vars
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {!mobile && (
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" style={{ color: 'var(--muted)' }} aria-hidden />
            <input
              ref={searchRef}
              type="search"
              data-testid="busca-secoes"
              aria-label="Buscar seções (atalho Control K)"
              placeholder="Buscar seções…"
              value={busca}
              onChange={(e) => onBusca(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent pr-12 pl-8 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border px-1.5 text-[10px] font-medium" style={{ borderColor: 'var(--glass-border)', color: 'var(--muted)' }}>
              ⌘K
            </kbd>
          </div>
        )}

        <div
          data-testid="barra-a11y"
          className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
          style={{ background: 'var(--glass-bg-thin)', color: 'var(--fg)' }}
          aria-live="polite"
        >
          <span className="size-1.5 rounded-full" style={{ background: criticoSerio > 0 ? 'var(--danger)' : 'var(--accent)' }} aria-hidden />
          WCAG AA: {a11yPassando}/{a11yTotal} pares passando
          {criticoSerio > 0 && (
            <button
              type="button"
              data-testid="badge-violacoes"
              onClick={onIrParaAuditoria}
              className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              style={{ background: 'var(--danger-soft)', color: 'var(--danger-text)' }}
            >
              <ShieldAlert className="size-3" aria-hidden />
              {criticoSerio} violações
            </button>
          )}
        </div>
      </div>
    </div>
  );
});