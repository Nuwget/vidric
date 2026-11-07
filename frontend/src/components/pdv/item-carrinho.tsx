'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { itemLista } from '@/lib/motion';
import { formatBRL } from '@/lib/format';
import { precoUnitario, subtotal, type ItemCarrinho } from '@/lib/pdv';

interface Props {
  item: ItemCarrinho;
  onMais: (chave: string) => void;
  onMenos: (chave: string) => void;
  onRemover: (chave: string) => void;
}

const BOTAO = 'size-12 grid place-items-center rounded-[calc(var(--radius)*0.6)] shrink-0';
const ESTILO_BOTAO = {
  border: '1px solid var(--glass-border)',
  background: 'transparent',
  color: 'var(--fg)',
} as const;

export function ItemCarrinhoLinha({ item, onMais, onMenos, onRemover }: Props) {
  const nome = item.tipo === 'Produto' ? item.produto.nome : item.descricao;
  const detalhe =
    item.tipo === 'Produto'
      ? [item.produto.modelo, item.produto.cor].filter(Boolean).join(' · ')
      : 'serviço';

  return (
    <motion.div variants={itemLista} className="flex flex-col gap-2 py-2.5 border-b" style={{ borderColor: 'var(--glass-border)' }}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug line-clamp-2">{nome}</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {detalhe || '—'} · {formatBRL(precoUnitario(item))}
          </p>
        </div>
        <span className="text-sm font-bold money shrink-0">{formatBRL(subtotal(item))}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Diminuir quantidade de ${nome}`}
          onClick={() => onMenos(item.chave)}
          className={BOTAO}
          style={ESTILO_BOTAO}
        >
          <Minus className="size-4" />
        </button>

        <span
          data-testid={`qtd-${item.chave}`}
          className="min-w-12 h-12 grid place-items-center rounded-[calc(var(--radius)*0.6)] text-[15px] font-semibold money"
          style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)' }}
        >
          {item.quantidade}
        </span>

        <button
          type="button"
          aria-label={`Aumentar quantidade de ${nome}`}
          onClick={() => onMais(item.chave)}
          className={BOTAO}
          style={ESTILO_BOTAO}
        >
          <Plus className="size-4" />
        </button>

        <button
          type="button"
          aria-label={`Remover ${nome} do carrinho`}
          onClick={() => onRemover(item.chave)}
          className={`${BOTAO} ml-auto`}
          style={{ ...ESTILO_BOTAO, color: 'var(--danger-text)' }}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </motion.div>
  );
}
