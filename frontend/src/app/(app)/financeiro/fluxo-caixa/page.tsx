'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFluxoCaixa, type PeriodoFiltro } from '@/hooks/useFinanceiro';
import { formatBRL } from '@/lib/format';
import { PeriodSelector, usePeriodoFinanceiro } from '../_components/period-selector';

function formatarData(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

const ROTULO_TIPO: Record<string, string> = {
  Abertura: 'Abertura',
  VendaDinheiro: 'Venda (dinheiro)',
  Suprimento: 'Suprimento',
  Sangria: 'Sangria',
  PagamentoConta: 'Pagamento de conta',
};

export default function FluxoCaixaPage() {
  const { preselecao, periodo, custom, selecionar } = usePeriodoFinanceiro();
  const filtro: PeriodoFiltro = periodo;
  const fluxo = useFluxoCaixa(filtro);
  const [tipo, setTipo] = useState('todos');

  const movimentos = useMemo(() => {
    const itens = fluxo.data?.movimentos ?? [];
    if (tipo === 'todos') return itens;
    return itens.filter((m) => (tipo === 'entradas' ? m.valor > 0 : m.valor < 0));
  }, [fluxo.data, tipo]);

  const carregando = fluxo.isLoading;

  return (
    <div className="flex flex-col gap-3.5 pb-4">
      <PeriodSelector preselecao={preselecao} custom={custom} onSelecionar={selecionar} />

      <div className="glass p-4 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <h2 className="text-sm font-semibold tracking-tight flex-1">Movimentos do caixa</h2>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger data-testid="filtro-tipo-movimento" aria-label="Tipo de movimento" className="h-11 w-full md:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="entradas">Entradas</SelectItem>
              <SelectItem value="saidas">Saídas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {carregando ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : movimentos.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground" data-testid="fluxo-vazio">
            Nenhum movimento de caixa no período.
          </p>
        ) : (
          <table className="w-full text-sm" data-testid="tabela-fluxo-caixa">
            <thead>
              <tr className="text-left text-xs text-muted-foreground" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th className="py-2.5 pr-3 font-medium">Data</th>
                <th className="py-2.5 pr-3 font-medium">Tipo</th>
                <th className="py-2.5 pr-3 font-medium">Descrição</th>
                <th className="py-2.5 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {movimentos.map((m, i) => (
                <motion.tr
                  key={`${m.dataHora}-${m.tipo}-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.2), type: 'spring', stiffness: 300, damping: 26 }}
                  style={{ borderBottom: '1px solid var(--glass-border)' }}
                  data-testid={`linha-movimento-${i}`}
                >
                  <td className="py-3 pr-3 text-muted-foreground whitespace-nowrap">{formatarData(m.dataHora)}</td>
                  <td className="py-3 pr-3">{ROTULO_TIPO[m.tipo] ?? m.tipo}</td>
                  <td className="py-3 pr-3 text-muted-foreground">{m.descricao ?? '—'}</td>
                  <td
                    className="py-3 text-right tabular-nums font-bold"
                    style={{ color: m.valor > 0 ? 'var(--accent-text)' : 'var(--danger-text)' }}
                    aria-label={m.valor > 0 ? `Entrada de ${formatBRL(m.valor)}` : `Saída de ${formatBRL(-m.valor)}`}
                  >
                    {m.valor > 0 ? '+' : '−'} {formatBRL(Math.abs(m.valor))}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="grid grid-cols-3 gap-3 pt-1" data-testid="resumo-fluxo">
          <div className="glass-card p-3">
            <p className="text-xs text-muted-foreground">Entradas</p>
            <p
              className="text-lg font-bold tabular-nums"
              style={{ color: 'var(--accent-text)' }}
              aria-label={`Entradas: ${formatBRL(fluxo.data?.entradas ?? 0)}`}
              data-testid="fluxo-entradas"
            >
              {formatBRL(fluxo.data?.entradas ?? 0)}
            </p>
          </div>
          <div className="glass-card p-3">
            <p className="text-xs text-muted-foreground">Saídas</p>
            <p
              className="text-lg font-bold tabular-nums"
              style={{ color: 'var(--danger-text)' }}
              aria-label={`Saídas: ${formatBRL(fluxo.data?.saidas ?? 0)}`}
              data-testid="fluxo-saidas"
            >
              {formatBRL(fluxo.data?.saidas ?? 0)}
            </p>
          </div>
          <div className="glass-card p-3">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p
              className="text-lg font-bold tabular-nums"
              aria-label={`Saldo: ${formatBRL(fluxo.data?.saldo ?? 0)}`}
              data-testid="fluxo-saldo"
            >
              {carregando ? '—' : formatBRL(fluxo.data?.saldo ?? 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
