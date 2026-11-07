'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { apiErrorMessage } from '@/lib/api';
import { useAlternarAtivo } from '@/hooks/useEstoque';
import type { Produto } from '@/types/api';

export function MenuAcoesProduto({ produto }: { produto: Produto }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const alternar = useAlternarAtivo();

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(evento: MouseEvent) {
      if (raiz.current && !raiz.current.contains(evento.target as Node)) setAberto(false);
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setAberto(false);
    }
    document.addEventListener('mousedown', aoClicarFora);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('mousedown', aoClicarFora);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto]);

  async function aoAlternar() {
    setAberto(false);
    try {
      const atualizado = await alternar.mutateAsync(produto.id);
      toast.success(atualizado.ativo ? 'Produto reativado.' : 'Produto desativado.');
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? 'Erro ao alterar o produto.');
    }
  }

  return (
    <div ref={raiz} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={`Ações de ${produto.nome}`}
        aria-expanded={aberto}
        data-testid={`acoes-produto-${produto.id}`}
        onClick={() => setAberto((v) => !v)}
        className="size-11 grid place-items-center rounded-[calc(var(--radius)*0.6)] text-muted-foreground hover:text-foreground transition-colors"
        style={{ border: '1px solid var(--glass-border)' }}
      >
        <MoreHorizontal className="size-5" />
      </button>
      {aberto && (
        <div
          role="menu"
          className="glass-modal absolute right-0 top-[calc(100%+6px)] z-50 min-w-[180px] p-2 flex flex-col"
        >
          <button
            type="button"
            role="menuitem"
            className="px-3 py-2.5 min-h-11 text-left text-sm rounded-[calc(var(--radius)*0.5)] hover:bg-[var(--accent-soft)]"
            onClick={() => {
              setAberto(false);
              router.push(`/estoque/${produto.id}`);
            }}
          >
            Ver detalhe
          </button>
          <button
            type="button"
            role="menuitem"
            data-testid={`menu-desativar-${produto.id}`}
            className="px-3 py-2.5 min-h-11 text-left text-sm rounded-[calc(var(--radius)*0.5)] hover:bg-[var(--danger-soft)]"
            style={{ color: produto.ativo ? 'var(--danger-text)' : 'var(--accent-text)' }}
            onClick={aoAlternar}
          >
            {produto.ativo ? 'Desativar' : 'Reativar'}
          </button>
        </div>
      )}
    </div>
  );
}