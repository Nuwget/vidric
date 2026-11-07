'use client';

import { Loader2, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { ItemCarrinhoLinha } from './item-carrinho';
import { entradaLista } from '@/lib/motion';
import { formatBRL } from '@/lib/format';
import { totalCarrinho, type ItemCarrinho } from '@/lib/pdv';

interface Props {
  itens: ItemCarrinho[];
  finalizando: boolean;
  onMais: (chave: string) => void;
  onMenos: (chave: string) => void;
  onRemover: (chave: string) => void;
  onFinalizar: () => void;
}

export function Carrinho({ itens, finalizando, onMais, onMenos, onRemover, onFinalizar }: Props) {
  const valorTotal = totalCarrinho(itens);
  const vazio = itens.length === 0;

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="flex items-center gap-2 text-xl font-bold tracking-[-0.022em]">
        <ShoppingCart className="size-5" />
        Carrinho
        <span className="text-xs font-normal text-muted-foreground ml-auto">
          {itens.reduce((acc, i) => acc + i.quantidade, 0)} itens
        </span>
      </div>

      {vazio ? (
        <p className="text-sm py-6 text-center" style={{ color: 'var(--muted)' }}>
          Toque em um produto para adicionar.
        </p>
      ) : (
        <motion.div
          variants={entradaLista}
          initial="initial"
          animate="animate"
          className="flex flex-col overflow-auto min-h-0 flex-1 pr-1"
        >
          {itens.map((item) => (
            <ItemCarrinhoLinha
              key={item.chave}
              item={item}
              onMais={onMais}
              onMenos={onMenos}
              onRemover={onRemover}
            />
          ))}
        </motion.div>
      )}

      <div className="flex items-center justify-between py-2 text-[22px] font-bold money tracking-[-0.022em]">
        <span>Total</span>
        <span data-testid="total-carrinho" style={{ color: 'var(--accent-text)' }}>
          {formatBRL(valorTotal)}
        </span>
      </div>

      <button
        type="button"
        data-testid="finalizar-venda"
        disabled={vazio || finalizando}
        onClick={onFinalizar}
        className="w-full rounded-[14px] font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50"
        style={{
          minHeight: 56,
          background: 'var(--accent)',
          color: 'var(--on-accent)',
          border: 'none',
          boxShadow: 'var(--shadow)',
        }}
      >
        {finalizando && <Loader2 className="size-4 animate-spin" />}
        Finalizar venda
      </button>
    </div>
  );
}
