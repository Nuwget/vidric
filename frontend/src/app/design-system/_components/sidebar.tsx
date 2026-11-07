'use client';

import {
  Activity,
  AppWindow,
  Bell,
  CreditCard,
  Inbox,
  List,
  ListFilter,
  MousePointerClick,
  Palette,
  Ruler,
  Table,
  Tag,
  TextCursorInput,
  Type,
  type LucideIcon,
} from 'lucide-react';
import { SECOES_INDEX } from './indice';

export const ICONES: Record<string, LucideIcon> = {
  Activity,
  AppWindow,
  Bell,
  CreditCard,
  Inbox,
  List,
  ListFilter,
  MousePointerClick,
  Palette,
  Ruler,
  Table,
  Tag,
  TextCursorInput,
  Type,
};

/** Fuzzy: substring pontua mais; senão, todos os chars da query em ordem. */
export function pontuarBusca(query: string, texto: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const t = texto.toLowerCase();
  const idx = t.indexOf(q);
  if (idx >= 0) return 100 - idx;
  let ti = 0;
  let pontos = 0;
  for (const ch of q) {
    const achou = t.indexOf(ch, ti);
    if (achou < 0) return 0;
    pontos += 1;
    ti = achou + 1;
  }
  return pontos;
}

export function secoesFiltradas(busca: string) {
  return SECOES_INDEX.map((s) => ({
    s,
    score: Math.max(pontuarBusca(busca, s.rotulo), pontuarBusca(busca, s.descricao) * 0.8),
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.s);
}

interface Props {
  ativo: string;
  busca: string;
  onNavegar: (id: string) => void;
}

export function DsSidebar({ ativo, busca, onNavegar }: Props) {
  const itens = secoesFiltradas(busca);
  return (
    <nav aria-label="Seções do design system" className="flex flex-col gap-0.5">
      {itens.length === 0 && (
        <p className="px-3 py-2 text-xs" style={{ color: 'var(--muted)' }}>
          Nenhuma seção para “{busca}”.
        </p>
      )}
      {itens.map((s) => {
        const Icone = ICONES[s.icone] ?? Palette;
        const active = ativo === s.id;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            data-testid={`nav-${s.id}`}
            aria-current={active ? 'true' : undefined}
            onClick={(e) => {
              e.preventDefault();
              onNavegar(s.id);
            }}
            className="group flex items-center gap-2.5 rounded-r-md border-l-2 py-2 pr-2 pl-2.5 text-[13px] font-medium transition-colors duration-150 outline-none hover:bg-[var(--accent-soft)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{
              borderColor: active ? 'var(--accent)' : 'transparent',
              background: active ? 'var(--accent-soft)' : undefined,
              color: active ? 'var(--accent-text)' : 'var(--fg)',
            }}
          >
            <Icone className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{s.rotulo}</span>
          </a>
        );
      })}
    </nav>
  );
}