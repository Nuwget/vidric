'use client';

import { useMemo } from 'react';
import { Loader2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { useProdutos } from '@/hooks/useProdutos';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { entradaLista, itemLista } from '@/lib/motion';
import { formatBRL } from '@/lib/format';
import type { Produto } from '@/types/api';

interface Props {
  busca: string;
  onBusca: (valor: string) => void;
  onAdicionar: (produto: Produto) => void;
}

export function BuscaProduto({ busca, onBusca, onAdicionar }: Props) {
  const buscaDebounce = useDebouncedValue(busca, 300);
  const { data: produtos, isFetching } = useProdutos({ busca: buscaDebounce, tamanho: 20 });

  const resultados = useMemo(() => produtos ?? [], [produtos]);

  return (
    <div className="flex flex-col gap-3.5 min-h-0">
      <div className="relative">
        <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="busca-produto"
          data-testid="busca-produto"
          autoFocus
          placeholder="Buscar por nome, modelo, cor ou código de barras"
          value={busca}
          onChange={(e) => onBusca(e.target.value)}
          className="h-12 pl-11 text-[15px]"
          style={{ background: 'var(--surface)', borderColor: 'var(--glass-border)' }}
        />
        {isFetching && (
          <Loader2 className="size-4 absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="text-xs text-muted-foreground" aria-live="polite">
        {resultados.length} {resultados.length === 1 ? 'produto' : 'produtos'}
      </div>

      <motion.div
        variants={entradaLista}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-auto pr-1 pb-2"
      >
        {resultados.map((produto) => (
          <motion.button
            key={produto.id}
            variants={itemLista}
            type="button"
            data-testid={`card-produto-${produto.id}`}
            onClick={() => onAdicionar(produto)}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="glass-card text-left p-3.5 flex flex-col gap-1 cursor-pointer"
          >
            <span className="text-[15px] font-semibold line-clamp-2">{produto.nome}</span>
            <span className="text-xs text-muted-foreground">
              {[produto.modelo, produto.cor].filter(Boolean).join(' · ') || '—'}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Estoque: <span className="font-semibold text-foreground">{produto.qtdEstoque}</span>
            </span>
            <span className="mt-1 font-bold money tracking-[-0.02em]" style={{ color: 'var(--accent-text)' }}>
              {formatBRL(produto.precoVenda)}
            </span>

            {(produto.abaixoDoMinimo || produto.qtdEstoque === 0) && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full self-start font-semibold"
                style={{ background: 'var(--danger-soft)', color: 'var(--danger-text)' }}
              >
                {produto.qtdEstoque === 0 ? 'Esgotado' : 'Abaixo do mínimo'}
              </span>
            )}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
