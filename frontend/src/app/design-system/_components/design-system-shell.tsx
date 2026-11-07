'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { bottomSheet } from '@/lib/motion';
import { ControlPanel } from './control-panel';
import { SECOES_INDEX } from './indice';
import {
  DS_DEFAULTS,
  aplicarConfig,
  buildExportCss,
  lerConfig,
  lerSnapshots,
  salvarConfig,
  salvarSnapshots,
  type DsConfig,
  type Snapshots,
} from './defaults';

/* Estilo escopado na rota: scrollbars na paleta, espessura da borda do vidro
   (o globals.css fixa padding: 1px no ::before), code blocks e o Toaster
   bottom-right desta página (o do app é top-center e fica oculto aqui). */
const PAGE_CSS = `
html.ds-active { scrollbar-color: var(--glass-border) transparent; }
html.ds-active::-webkit-scrollbar { width: 10px; height: 10px; }
html.ds-active::-webkit-scrollbar-track { background: transparent; }
html.ds-active::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 8px; }
html.ds-active::-webkit-scrollbar-thumb:hover { background: var(--accent); }
html.ds-active [data-sonner-toaster]:not(.ds-toaster) { display: none !important; }
.ds-shell .glass::before, .ds-shell .glass-card::before { padding: var(--glass-border-width, 1px); }
.ds-shell .surface { border-width: var(--glass-border-width, 1px); }
.ds-shell[data-show-code="false"] .ds-code { display: none; }
`;

export function DesignSystemShell({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<DsConfig | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshots>({});
  const [mobile, setMobile] = useState<boolean | null>(null);
  const [painelAberto, setPainelAberto] = useState(false);

  useEffect(() => {
    setConfig(lerConfig());
    setSnapshots(lerSnapshots());
    const mq = window.matchMedia('(max-width: 767px)');
    setMobile(mq.matches);
    const ouvir = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', ouvir);
    document.documentElement.classList.add('ds-active');
    return () => {
      mq.removeEventListener('change', ouvir);
      document.documentElement.classList.remove('ds-active');
    };
  }, []);

  useEffect(() => {
    if (!config) return;
    aplicarConfig(config);
    salvarConfig(config);
  }, [config]);

  const efetivo = config ?? DS_DEFAULTS;

  const mudar = useCallback((patch: Partial<DsConfig>) => {
    setConfig((atual) => ({ ...(atual ?? DS_DEFAULTS), ...patch }));
  }, []);

  const resetar = useCallback(() => {
    setConfig((atual) => ({
      ...DS_DEFAULTS,
      theme: atual?.theme ?? DS_DEFAULTS.theme,
      showCode: atual?.showCode ?? DS_DEFAULTS.showCode,
    }));
    toast.success('Valores do playground restaurados.');
  }, []);

  const exportar = useCallback(async () => {
    const css = buildExportCss(config ?? DS_DEFAULTS);
    try {
      await navigator.clipboard.writeText(css);
      toast.success('CSS vars copiadas.', {
        description: 'Aprovou? Atualize o playground e cole no globals.css.',
      });
    } catch {
      toast.error('Não foi possível copiar para o clipboard.');
    }
  }, [config]);

  const salvarSnapshot = useCallback(
    (nome: string) => {
      setSnapshots((atuais) => {
        const novos = { ...atuais, [nome]: config ?? DS_DEFAULTS };
        salvarSnapshots(novos);
        return novos;
      });
      toast.success(`Snapshot “${nome}” salvo.`);
    },
    [config],
  );

  const aplicarSnapshot = useCallback(
    (nome: string) => {
      const s = snapshots[nome];
      if (!s) return;
      setConfig({ ...s });
      toast.success(`Snapshot “${nome}” aplicado.`);
    },
    [snapshots],
  );

  const excluirSnapshot = useCallback((nome: string) => {
    setSnapshots((atuais) => {
      const novos = { ...atuais };
      delete novos[nome];
      salvarSnapshots(novos);
      return novos;
    });
  }, []);

  const painel = (
    <ControlPanel
      config={efetivo}
      snapshots={snapshots}
      onChange={mudar}
      onReset={resetar}
      onExport={exportar}
      onSalvarSnapshot={salvarSnapshot}
      onAplicarSnapshot={aplicarSnapshot}
      onExcluirSnapshot={excluirSnapshot}
    />
  );

  return (
    <div
      className="ds-shell min-h-dvh"
      data-show-code={efetivo.showCode}
      data-testid="design-system"
    >
      <style>{PAGE_CSS}</style>
      <Toaster className="ds-toaster" theme={efetivo.theme} position="bottom-right" richColors closeButton />

      <div className="md:mr-[336px]">
        <header className="glass sticky top-0 z-30 flex flex-col gap-2.5 px-4 py-3.5 md:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0">
              <h1 className="brand-text text-lg font-bold tracking-[-0.022em] md:text-xl">
                Design System — Vidric
              </h1>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Ferramenta de dev. Não vai para produção.
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" data-testid="botao-reset" onClick={resetar}>
                <RotateCcw data-icon="inline-start" />
                Reset
              </Button>
              <Button type="button" size="sm" data-testid="botao-exportar-css" onClick={exportar}>
                <Copy data-icon="inline-start" />
                Exportar CSS vars
              </Button>
            </div>
          </div>
          <nav aria-label="Seções" className="-mb-1 flex gap-1.5 overflow-x-auto pb-1">
            {SECOES_INDEX.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors"
                style={{ background: 'var(--glass-bg-thin)', color: 'var(--muted)' }}
              >
                {s.rotulo}
              </a>
            ))}
          </nav>
        </header>

        <main className="flex flex-col gap-6 px-4 py-6 md:px-6">{children}</main>

        <footer className="px-4 pb-8 text-xs md:px-6" style={{ color: 'var(--muted)' }}>
          Tokens: <span className="font-mono">theme-playground/index.html</span> · Componentes: esta
          página. Em produção (<span className="font-mono">NODE_ENV=production</span>) a rota retorna 404.
        </footer>
      </div>

      {mobile === false && (
        <aside
          data-testid="painel-desktop"
          className="glass fixed bottom-4 right-4 top-4 z-40 w-[320px] overflow-y-auto p-4"
        >
          {painel}
        </aside>
      )}

      {mobile === true && (
        <>
          <button
            type="button"
            data-testid="abrir-painel"
            onClick={() => setPainelAberto(true)}
            className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 font-semibold"
            style={{
              minHeight: 48,
              background: 'var(--accent-glass)',
              color: 'var(--on-accent)',
              border: 'none',
              borderRadius: 'calc(var(--radius) * 0.75)',
              boxShadow: 'var(--shadow-glass)',
            }}
          >
            <SlidersHorizontal className="size-4" />
            Ajustes
          </button>
          <AnimatePresence>
            {painelAberto && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setPainelAberto(false)}
                  className="fixed inset-0 z-50 bg-black/40"
                  aria-hidden
                />
                <motion.div
                  data-testid="painel-folha"
                  variants={bottomSheet}
                  initial="fechado"
                  animate="aberto"
                  exit="fechado"
                  className="glass fixed bottom-0 left-0 right-0 z-50 max-h-[82dvh] overflow-auto p-4"
                >
                  <div className="mb-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setPainelAberto(false)}
                      aria-label="Fechar painel"
                      className="grid size-9 place-items-center rounded-full"
                      style={{ background: 'var(--glass-bg-thin)', color: 'var(--fg)' }}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  {painel}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}