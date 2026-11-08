'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { ReceberFiadoModal } from '../_components/receber-fiado-modal';
import { useAReceber } from '@/hooks/useFinanceiro';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatBRL, formatCpf } from '@/lib/format';
import type { VendaAReceber } from '@/types/api';

function BadgeStatus({ status }: { status: string }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: 'var(--warning-soft)', color: 'var(--warning-text)' }}
    >
      {status}
    </span>
  );
}

export default function AReceberPage() {
  const aReceber = useAReceber();
  const [buscaInput, setBuscaInput] = useState('');
  const busca = useDebouncedValue(buscaInput, 250);
  const [vendaSelecionada, setVendaSelecionada] = useState<VendaAReceber | null>(null);

  const lista = useMemo(() => {
    const vendas = aReceber.data ?? [];
    const termo = busca.replace(/\D/g, '');
    if (!termo) return vendas;
    return vendas.filter((v) => (v.cpfCliente ?? '').includes(termo));
  }, [aReceber.data, busca]);

  const totalAReceber = lista.reduce((s, v) => s + v.saldo, 0);
  const carregando = aReceber.isLoading;

  return (
    <div className="flex flex-col gap-3.5 pb-4">
      <div className="glass p-5" data-testid="a-receber-total">
        <p className="text-sm text-muted-foreground">Total a receber</p>
        <p
          className="mt-1 text-[40px] md:text-[44px] font-bold tabular-nums tracking-tight leading-none"
          style={{ color: 'var(--warning-text)' }}
          aria-label={`Total a receber: ${formatBRL(totalAReceber)}`}
        >
          {carregando ? '—' : formatBRL(totalAReceber)}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {carregando ? 'Carregando…' : `${lista.length} ${lista.length === 1 ? 'venda fiado em aberto' : 'vendas fiado em aberto'} · mais antigas primeiro`}
        </p>
      </div>

      <div className="glass p-4 flex flex-col gap-3">
        <input
          data-testid="busca-cpf"
          aria-label="Buscar por CPF do cliente"
          placeholder="Buscar por CPF do cliente"
          className="h-12 w-full md:max-w-sm rounded-[calc(var(--radius)*0.6)] px-3.5 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          style={{ border: '1px solid var(--glass-border)', color: 'var(--fg)' }}
          value={buscaInput}
          onChange={(e) => setBuscaInput(e.target.value)}
        />

        {carregando ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : lista.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground" data-testid="a-receber-vazio">
            {buscaInput ? 'Nenhuma venda encontrada para este CPF.' : 'Nenhum fiado em aberto.'}
          </p>
        ) : (
          <>
            <table className="hidden md:table w-full text-sm" data-testid="tabela-a-receber">
              <thead>
                <tr className="text-left text-xs text-muted-foreground" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th className="py-2.5 pr-3 font-medium">Data</th>
                  <th className="py-2.5 pr-3 font-medium">CPF do cliente</th>
                  <th className="py-2.5 pr-3 font-medium">Total</th>
                  <th className="py-2.5 pr-3 font-medium">Pago</th>
                  <th className="py-2.5 pr-3 font-medium">Saldo</th>
                  <th className="py-2.5 pr-3 font-medium">Status</th>
                  <th className="py-2.5 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((v, i) => (
                  <motion.tr
                    key={v.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.2), type: 'spring', stiffness: 300, damping: 26 }}
                    className="transition-colors hover:bg-[var(--accent-soft)]"
                    style={{ borderBottom: '1px solid var(--glass-border)' }}
                    data-testid={`linha-a-receber-${v.id}`}
                  >
                    <td className="py-3 pr-3 text-muted-foreground">
                      {new Date(v.dataHora).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 pr-3">{v.cpfCliente ? formatCpf(v.cpfCliente) : <span className="text-muted-foreground">sem CPF</span>}</td>
                    <td className="py-3 pr-3 tabular-nums">{formatBRL(v.total)}</td>
                    <td className="py-3 pr-3 tabular-nums text-muted-foreground">{formatBRL(v.totalPago)}</td>
                    <td className="py-3 pr-3 tabular-nums font-bold" style={{ color: 'var(--warning-text)' }}>
                      {formatBRL(v.saldo)}
                    </td>
                    <td className="py-3 pr-3"><BadgeStatus status={v.status} /></td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        data-testid={`botao-receber-${v.id}`}
                        onClick={() => setVendaSelecionada(v)}
                        className="h-10 px-3.5 rounded-[calc(var(--radius)*0.6)] text-sm font-semibold transition-transform active:scale-[0.97]"
                        style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
                      >
                        Receber
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            <div className="md:hidden flex flex-col gap-2.5" data-testid="cards-a-receber">
              {lista.map((v) => (
                <div
                  key={v.id}
                  data-testid={`card-a-receber-${v.id}`}
                  className="glass-card p-4 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(v.dataHora).toLocaleDateString('pt-BR')} ·{' '}
                      {v.cpfCliente ? formatCpf(v.cpfCliente) : 'sem CPF'} · <BadgeStatus status={v.status} />
                    </p>
                    <p className="mt-1 text-sm tabular-nums">
                      Total {formatBRL(v.total)} · Pago {formatBRL(v.totalPago)}
                    </p>
                    <p className="mt-0.5 text-sm font-bold tabular-nums" style={{ color: 'var(--warning-text)' }}>
                      Saldo {formatBRL(v.saldo)}
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid={`botao-receber-mobile-${v.id}`}
                    onClick={() => setVendaSelecionada(v)}
                    className="h-10 px-3.5 rounded-[calc(var(--radius)*0.6)] text-sm font-semibold transition-transform active:scale-[0.97] shrink-0"
                    style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
                  >
                    Receber
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ReceberFiadoModal venda={vendaSelecionada} onFechar={() => setVendaSelecionada(null)} />
    </div>
  );
}
