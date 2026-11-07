'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProdutosParados } from '@/hooks/useEstoque';
import { formatBRL } from '@/lib/format';

const JANELAS = [7, 30, 60, 90];

export default function ParadosPage() {
  const router = useRouter();
  const [dias, setDias] = useState(30);
  const { data, isLoading } = useProdutosParados(dias);

  return (
    <div className="flex flex-col gap-3.5 pb-4">
      <div className="glass p-5 md:p-6">
        <Link href="/estoque" className="text-sm text-muted-foreground no-underline hover:underline">
          ← Estoque
        </Link>
        <div className="mt-3 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.022em]" data-testid="titulo-parados">
              Produtos parados há {dias} dias
            </h1>
            <p className="mt-1.5 text-lg font-bold money tracking-[-0.022em]" style={{ color: 'var(--warning-text)' }} data-testid="valor-imobilizado">
              {data ? `${formatBRL(data.valorTotalImobilizado)} em mercadoria sem giro` : '—'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Dinheiro parado na gaveta. O que dói mais aparece primeiro.
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">Sem venda nos últimos</span>
            <Select value={String(dias)} onValueChange={(v) => setDias(Number(v))}>
              <SelectTrigger data-testid="select-dias" aria-label="Janela em dias" className="h-12 w-full md:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JANELAS.map((j) => (
                  <SelectItem key={j} value={String(j)}>
                    {j} dias
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="glass p-4 md:p-5">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando relatório…</p>
        ) : !data || data.itens.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground" data-testid="parados-vazio">
            Nenhum produto parado neste período. Estoque girando.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.itens.map((item, indice) => (
              <button
                key={item.produtoId}
                type="button"
                data-testid={`item-parado-${item.produtoId}`}
                onClick={() => router.push(`/estoque/${item.produtoId}`)}
                className="glass-card p-4 text-left flex items-center gap-3"
              >
                <span
                  className="hidden md:grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold money"
                  style={{ background: 'var(--warning-soft)', color: 'var(--warning-text)' }}
                >
                  {indice + 1}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-[15px] leading-snug truncate">{item.nome}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    {[item.modelo, item.cor].filter(Boolean).join(' · ') || '—'} · {item.qtdEstoque} un × {formatBRL(item.custo)}
                  </span>
                </span>
                <span className="text-right shrink-0">
                  <span className="block money font-bold" style={{ color: 'var(--warning-text)' }}>
                    {formatBRL(item.valorImobilizado)}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">imobilizado</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}