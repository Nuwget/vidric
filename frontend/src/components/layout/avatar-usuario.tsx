'use client';

import { useEffect, useRef, useState } from 'react';
import { decodeJwt, readSession } from '@/lib/auth';
import type { PapelUsuario } from '@/types/api';

interface Props {
  nome: string;
  onSair: () => void;
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '—';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/** Avatar com iniciais + dropdown glass: quem está logado, sem tela de edição. */
export function AvatarUsuario({ nome, onSair }: Props) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function aoClicar(evento: MouseEvent) {
      if (raiz.current && !raiz.current.contains(evento.target as Node)) setAberto(false);
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setAberto(false);
    }
    document.addEventListener('mousedown', aoClicar);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('mousedown', aoClicar);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto]);

  const email = decodeJwt(readSession()?.token ?? '')?.email ?? null;
  const papel: PapelUsuario | null = readSession()?.papel ?? null;

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        data-testid="avatar-usuario"
        aria-label="Menu do usuário"
        aria-expanded={aberto}
        onClick={() => setAberto((atual) => !atual)}
        className="size-12 grid place-items-center rounded-full text-sm font-semibold cursor-pointer transition-transform active:scale-[0.94]"
        style={{
          background: 'var(--accent-soft)',
          color: 'var(--accent-text)',
          border: '1px solid var(--glass-border)',
        }}
      >
        {iniciais(nome)}
      </button>

      {aberto && (
        <div
          data-testid="menu-usuario"
          role="menu"
          className="glass-modal absolute right-0 top-[calc(100%+10px)] z-50 min-w-[240px] p-4 flex flex-col gap-2"
        >
          <div>
            <p className="font-semibold tracking-[-0.01em]">{nome}</p>
            {email && <p className="text-xs mt-0.5 break-all" style={{ color: 'var(--muted)' }}>{email}</p>}
          </div>
          {papel && (
            <span
              className="self-start text-[11px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}
            >
              {papel}
            </span>
          )}
          <button
            type="button"
            role="menuitem"
            data-testid="menu-usuario-sair"
            onClick={onSair}
            className="text-left mt-1 px-3 font-semibold"
            style={{
              minHeight: 44,
              color: 'var(--danger-text)',
              background: 'var(--danger-soft)',
              border: 'none',
              borderRadius: 'calc(var(--radius) * 0.6)',
              cursor: 'pointer',
            }}
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
