'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { bottomSheet } from '@/lib/motion';
import { ControlPanel } from './control-panel';
import { DsSidebar } from './sidebar';
import { DsTopbar } from './topbar';
import { SECOES_INDEX } from './indice';
import { coletarParesContraste, rodarAuditoriaAxe, baixarJson, type ResultadoAxe } from './lib/a11y';
import type { ParContraste } from './lib/contrast';
import {
  DS_DEFAULTS,
  aplicarConfig,
  buildExportCss,
  lerConfig,
  lerSnapshots,
  limparConfigAplicada,
  salvarConfig,
  salvarSnapshots,
  type DsConfig,
  type Snapshots,
} from './defaults';

/* Estilo escopado na rota (html.ds-active): scrollbars na paleta, espessura da
   borda do vidro, code blocks, Toaster bottom-right desta página, focus ring
   universal e as media queries de acessibilidade (reduced-motion / contrast).
   Nada aqui toca o globals.css — só vale enquanto esta rota está montada. */
const PAGE_CSS = `
html.ds-active { scrollbar-color: var(--glass-border) transparent; }
html.ds-active::-webkit-scrollbar { width: 10px; height: 10px; }
html.ds-active::-webkit-scrollbar-track { background: transparent; }
html.ds-active::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 8px; }
html.ds-active::-webkit-scrollbar-thumb:hover { background: var(--accent); }
html.ds-active [data-sonner-toaster]:not(.ds-toaster) { display: none !important; }
/* O Sonner monta um <section aria-label> mesmo sem toasts; esconder só o ol
   deixaria dois landmarks "Notifications" (axe landmark-unique). */
html.ds-active section[aria-label="Notifications alt+T"]:not(.ds-shell section) { display: none !important; }
.ds-shell .glass, .ds-shell .glass-card { border-width: var(--glass-border-width, 1px); }
.ds-shell .surface { border-width: var(--glass-border-width, 1px); }
.ds-shell[data-show-code="false"] .ds-code { display: none; }

/* Code blocks shiki: vidro por baixo, realce por cima. O fundo sólido do tema
   shiki é cancelado para o glass aparecer; as cores dos tokens permanecem. */
.ds-shell .ds-shiki .shiki { background: transparent !important; margin: 0; font-size: 12px; }
.ds-shell .ds-shiki .shiki code { font-family: var(--font-geist-mono), ui-monospace, monospace; }
.ds-shell .ds-code-lines .shiki code { counter-reset: line; }
.ds-shell .ds-code-lines .shiki .line::before {
  counter-increment: line; content: counter(line);
  display: inline-block; width: 2em; margin-right: 1em; text-align: right;
  color: var(--muted); opacity: 0.6;
}

/* Focus ring universal: 2px accent, offset 2px — nunca outline:none sem substituto. */
html.ds-active :focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Movimento reduzido: media query real + toggle simulado no painel. */
@media (prefers-reduced-motion: reduce) {
  html.ds-active *, html.ds-active *::before, html.ds-active *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
html.ds-active[data-reduced-motion="true"] *,
html.ds-active[data-reduced-motion="true"] *::before,
html.ds-active[data-reduced-motion="true"] *::after {
  animation-duration: 0.001ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.001ms !important;
  scroll-behavior: auto !important;
}

/* Contraste aumentado: media query real + toggle simulado. Bordas mais fortes. */
@media (prefers-contrast: more) {
  html.ds-active[data-theme="light"] { --glass-border: rgba(0, 0, 0, 0.45); }
  html.ds-active[data-theme="dark"] { --glass-border: rgba(255, 255, 255, 0.5); }
}
html.ds-active[data-contrast="more"][data-theme="light"] { --glass-border: rgba(0, 0, 0, 0.45); }
html.ds-active[data-contrast="more"][data-theme="dark"] { --glass-border: rgba(255, 255, 255, 0.5); }

/* Skip link: invisível até receber foco. */
.ds-skip-link {
  position: fixed; top: -100px; left: 16px; z-index: 100;
  padding: 10px 18px; border-radius: 10px; font-size: 14px; font-weight: 600;
  background: var(--accent); color: var(--on-accent); box-shadow: var(--shadow-glass);
  transition: top 150ms ease;
}
.ds-skip-link:focus { top: 16px; }
`;

export function DesignSystemShell({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<DsConfig | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshots>({});
  const [mobile, setMobile] = useState<boolean | null>(null);
  const [painelAberto, setPainelAberto] = useState(false);
  const [navAberto, setNavAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [ativo, setAtivo] = useState(SECOES_INDEX[0].id);
  const [montado, setMontado] = useState(false);
  const [pares, setPares] = useState<ParContraste[]>([]);
  const [axeResultado, setAxeResultado] = useState<ResultadoAxe | null>(null);
  const [axeRodando, setAxeRodando] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setConfig(lerConfig());
    setSnapshots(lerSnapshots());
    const mq = window.matchMedia('(max-width: 767px)');
    setMobile(mq.matches);
    const ouvir = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', ouvir);
    document.documentElement.classList.add('ds-active');
    setMontado(true);
    return () => {
      mq.removeEventListener('change', ouvir);
      document.documentElement.classList.remove('ds-active');
      limparConfigAplicada();
    };
  }, []);

  useEffect(() => {
    if (!config) return;
    aplicarConfig(config);
    salvarConfig(config);
  }, [config]);

  const efetivo = config ?? DS_DEFAULTS;

  // Scroll spy: a seção cujo topo passou da zona do header é a ativa.
  useEffect(() => {
    const ids = SECOES_INDEX.map((s) => s.id);
    let raf = 0;
    const atualizar = () => {
      raf = 0;
      let atual = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 180) atual = id;
      }
      setAtivo(atual);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(atualizar);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    atualizar();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [montado]);

  // ⌘K / Ctrl+K foca a busca (desktop).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Pares de contraste para a barra WCAG AA — recalcula quando o tema/zoom/
  // contraste mudam (e na montagem), com debounce para o DOM assentar.
  useEffect(() => {
    if (!montado) return;
    const t = setTimeout(() => setPares(coletarParesContraste()), 350);
    return () => clearTimeout(t);
  }, [montado, efetivo.theme, efetivo.fontScale, efetivo.highContrast, efetivo.showCode, efetivo.cores]);

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

  const navegar = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: efetivo.reducedMotion ? 'auto' : 'smooth', block: 'start' });
        setAtivo(id);
      }
      setNavAberto(false);
    },
    [efetivo.reducedMotion],
  );

  const rodarAxe = useCallback(async () => {
    setAxeRodando(true);
    try {
      const res = await rodarAuditoriaAxe();
      setAxeResultado(res);
      setPares(coletarParesContraste());
      if (res.criticoSerio === 0) {
        toast.success('Auditoria axe: 0 violações critical/serious.');
      } else {
        toast.error(`${res.criticoSerio} violações critical/serious encontradas.`);
      }
    } catch {
      toast.error('Falha ao rodar a auditoria axe.');
    } finally {
      setAxeRodando(false);
    }
  }, []);

  const exportarRelatorio = useCallback(() => {
    if (!axeResultado) return;
    baixarJson('design-system-a11y-report.json', {
      ...axeResultado,
      contraste: pares,
      config: efetivo,
    });
    toast.success('Relatório de acessibilidade exportado.');
  }, [axeResultado, pares, efetivo]);

  const focarViolacao = useCallback((target: string[]) => {
    const el = document.querySelector(target.join(' '));
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
      const anterior = el.style.outline;
      el.style.outline = '2px solid var(--danger)';
      setTimeout(() => {
        el.style.outline = anterior;
      }, 2000);
    }
  }, []);

  const irParaAuditoria = useCallback(() => {
    if (mobile) setPainelAberto(true);
    setTimeout(() => {
      const alvo =
        document.querySelector('[data-testid="resultado-axe"]') ??
        document.querySelector('[data-testid="botao-auditar-axe"]');
      if (alvo instanceof HTMLElement) {
        alvo.scrollIntoView({ behavior: 'smooth', block: 'center' });
        alvo.focus();
      }
    }, mobile ? 320 : 0);
  }, [mobile]);

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
      onRodarAxe={rodarAxe}
      axeRodando={axeRodando}
      axeResultado={axeResultado}
      onExportarRelatorio={exportarRelatorio}
      onFocarViolacao={focarViolacao}
    />
  );

  const rotuloAtivo = SECOES_INDEX.find((s) => s.id === ativo)?.rotulo ?? 'Colors';
  const passando = pares.filter((p) => p.passa).length;
  const criticoSerio = axeResultado?.criticoSerio ?? 0;

  const tituloSidebar = (
    <div className="mb-4">
      <h1 className="brand-text text-lg font-bold tracking-[-0.022em]">Design System</h1>
      <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
        Vidric · ferramenta de dev
      </p>
    </div>
  );

  return (
    <div
      className="ds-shell min-h-dvh"
      data-show-code={efetivo.showCode}
      data-testid="design-system"
    >
      <style>{PAGE_CSS}</style>
      <a href="#conteudo" className="ds-skip-link">
        Pular para o conteúdo
      </a>
      <Toaster className="ds-toaster" theme={efetivo.theme} position="bottom-right" richColors closeButton />

      {/* Sidebar lateral fixa (desktop) — 250px, vidro sobre o mesh. */}
      {mobile === false && (
        <aside
          data-testid="sidebar-desktop"
          aria-label="Navegação do design system"
          className="glass fixed bottom-0 left-0 top-0 z-40 flex w-[250px] flex-col overflow-y-auto p-4"
        >
          {tituloSidebar}
          <DsSidebar ativo={ativo} busca={busca} onNavegar={navegar} />
        </aside>
      )}

      <div className="md:mr-[336px] md:ml-[250px]">
        <header className="glass sticky top-0 z-30 px-4 py-3 md:px-6">
          <DsTopbar
            ref={searchRef}
            secaoAtual={rotuloAtivo}
            busca={busca}
            onBusca={setBusca}
            onReset={resetar}
            onExport={exportar}
            mobile={mobile === true}
            onAbrirNav={() => setNavAberto(true)}
            a11yPassando={passando}
            a11yTotal={pares.length}
            criticoSerio={criticoSerio}
            onIrParaAuditoria={irParaAuditoria}
          />
        </header>

        <main id="conteudo" tabIndex={-1} className="flex flex-col gap-16 px-4 py-8 outline-none md:px-6">
          {/* No mobile o h1 vive no drawer fechado (aria-hidden); um h1 sr-only
              mantém a página com um heading de nível 1 (axe page-has-heading-one). */}
          {mobile === true && <h1 className="sr-only">Design System</h1>}
          {children}
        </main>

        <footer className="px-4 pb-8 text-xs md:px-6" style={{ color: 'var(--muted)' }}>
          Tokens: <span className="font-mono">theme-playground/index.html</span> · Componentes: esta
          página. Em produção (<span className="font-mono">NODE_ENV=production</span>) a rota retorna 404.
        </footer>
      </div>

      {/* Painel de controle fixo à direita (desktop). */}
      {mobile === false && (
        <aside
          data-testid="painel-desktop"
          aria-label="Painel de controle"
          className="glass fixed bottom-4 right-4 top-4 z-40 w-[320px] overflow-y-auto p-4"
        >
          {painel}
        </aside>
      )}

      {/* Mobile: drawer de navegação (Sheet) + painel em bottom-sheet. */}
      {mobile === true && (
        <>
          <Sheet open={navAberto} onOpenChange={setNavAberto}>
            <SheetContent
              side="left"
              data-testid="nav-folha"
              className="glass w-[280px] bg-transparent p-0 sm:max-w-[280px]"
            >
              <SheetHeader className="border-b p-4 text-left" style={{ borderColor: 'var(--glass-border)' }}>
                <SheetTitle className="brand-text text-lg font-bold tracking-[-0.022em]">
                  Design System
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Navegue pelas {SECOES_INDEX.length} seções.
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-3 overflow-y-auto p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" style={{ color: 'var(--muted)' }} aria-hidden />
                  <input
                    type="search"
                    data-testid="busca-secoes-mobile"
                    aria-label="Buscar seções"
                    placeholder="Buscar seções…"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-transparent pr-3 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>
                <DsSidebar ativo={ativo} busca={busca} onNavegar={navegar} />
              </div>
            </SheetContent>
          </Sheet>

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
            <SlidersHorizontal className="size-4" aria-hidden />
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
                      <X className="size-4" aria-hidden />
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