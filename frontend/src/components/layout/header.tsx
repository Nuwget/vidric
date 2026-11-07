'use client';

import { Menu } from 'lucide-react';
import { BotaoSair } from '@/components/layout/sidebar';

interface Props {
  nomeLoja: string | null;
  nomeUsuario: string;
  onAbrirMenu: () => void;
  onSair: () => void;
}

export function Header({ nomeLoja, nomeUsuario, onAbrirMenu, onSair }: Props) {
  return (
    <header className="glass flex items-center gap-2.5 px-4 py-3">
      <button
        type="button"
        onClick={onAbrirMenu}
        aria-label="Abrir menu"
        className="md:hidden size-12 grid place-items-center rounded-[calc(var(--radius)*0.6)]"
        style={{ border: '1px solid var(--glass-border)', color: 'var(--fg)' }}
      >
        <Menu className="size-5" />
      </button>

      <span className="text-[17px] font-semibold tracking-[-0.022em]">{nomeLoja ?? '—'}</span>
      <span className="text-sm text-muted-foreground ml-0.5 truncate">{nomeUsuario}</span>

      <BotaoSair onClick={onSair} className="ml-auto" />
    </header>
  );
}
