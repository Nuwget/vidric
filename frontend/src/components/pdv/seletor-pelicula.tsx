'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useProdutos } from '@/hooks/useProdutos';
import { CATEGORIA_PELICULA, SERVICO_APLICACAO } from '@/lib/pdv';
import { formatBRL } from '@/lib/format';
import type { Produto } from '@/types/api';

interface Props {
  onEscolher: (produto: Produto) => void;
}

/**
 * Atalho do balcão: escolhe a película e lança dois itens no carrinho —
 * o produto (baixa estoque) e o serviço de aplicação (não baixa).
 */
export function SeletorPelicula({ onEscolher }: Props) {
  const [aberto, setAberto] = useState(false);
  const { data: produtos, isLoading } = useProdutos(
    { categoria: CATEGORIA_PELICULA, tamanho: 50 },
    aberto,
  );

  function escolher(produto: Produto) {
    onEscolher(produto);
    setAberto(false);
  }

  return (
    <>
      <button
        type="button"
        data-testid="botao-pelicula"
        onClick={() => setAberto(true)}
        className="self-start whitespace-nowrap text-center font-semibold flex items-center gap-2 px-4 w-full md:w-auto"
        style={{
          minHeight: 48,
          background: 'var(--accent)',
          color: 'var(--on-accent)',
          border: 'none',
          borderRadius: 'calc(var(--radius) * 0.75)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <Sparkles className="size-4" />
        + Película c/ Aplicação
      </button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="glass rounded-[var(--radius)] sm:max-w-md p-6 ring-0">
          <DialogHeader>
            <DialogTitle>Película + aplicação</DialogTitle>
            <DialogDescription className="text-sm" style={{ color: 'var(--muted)' }}>
              Escolhe a película. A aplicação ({formatBRL(SERVICO_APLICACAO.precoUnitario)}) entra como
              serviço no mesmo carrinho.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="grid place-items-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[52dvh] overflow-auto pr-1">
              {(produtos ?? []).map((produto) => (
                <button
                  key={produto.id}
                  type="button"
                  data-testid={`pelicula-${produto.id}`}
                  onClick={() => escolher(produto)}
                  className="text-left px-4 py-3 flex items-center gap-3"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'calc(var(--radius) * 0.7)',
                  }}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium leading-snug line-clamp-2">
                      {produto.nome}
                    </span>
                    <span className="block text-xs" style={{ color: 'var(--muted)' }}>
                      {[produto.cor, produto.modelo].filter(Boolean).join(' · ') || '—'} · estoque{' '}
                      {produto.qtdEstoque}
                    </span>
                  </span>
                  <span className="font-bold money shrink-0" style={{ color: 'var(--accent-text)' }}>
                    {formatBRL(produto.precoVenda)}
                  </span>
                </button>
              ))}
              {(produtos ?? []).length === 0 && (
                <p className="text-sm py-6 text-center" style={{ color: 'var(--muted)' }}>
                  Nenhuma película cadastrada nesta categoria.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
