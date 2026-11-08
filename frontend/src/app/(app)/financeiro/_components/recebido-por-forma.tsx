'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBRL } from '@/lib/format';
import type { DashboardFinanceiro } from '@/types/api';

const FORMAS = [
  { chave: 'dinheiro', rotulo: 'Dinheiro', cor: '#2e7d32' },
  { chave: 'pix', rotulo: 'Pix', cor: '#3b82f6' },
  { chave: 'cartaoDebito', rotulo: 'Cartão Débito', cor: '#8b5cf6' },
  { chave: 'cartaoCredito', rotulo: 'Cartão Crédito', cor: '#f59e0b' },
  { chave: 'outro', rotulo: 'Outro', cor: '#6b7280' },
] as const;

interface Props {
  dashboard?: DashboardFinanceiro;
}

export function RecebidoPorForma({ dashboard }: Props) {
  const carregando = !dashboard;
  const total = dashboard ? FORMAS.reduce((s, f) => s + dashboard.recebidoPorForma[f.chave], 0) : 0;
  const fatias = dashboard
    ? FORMAS.map((f) => ({ ...f, valor: dashboard.recebidoPorForma[f.chave] })).filter((f) => f.valor > 0)
    : [];

  return (
    <div className="glass p-4 flex flex-col gap-3" data-testid="grafico-recebido-por-forma">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">Recebido por forma</h2>
        <p className="text-xs text-muted-foreground">Como o dinheiro entrou no período</p>
      </div>

      {carregando ? (
        <Skeleton className="h-[200px] w-full" />
      ) : total === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground" data-testid="por-forma-vazio">
          Nada recebido no período.
        </p>
      ) : (
        <>
          <div
            className="h-[200px] w-full"
            role="img"
            aria-label="Gráfico de rosca: recebido por forma de pagamento. Detalhes na lista abaixo."
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fatias}
                  dataKey="valor"
                  nameKey="rotulo"
                  innerRadius="62%"
                  outerRadius="92%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {fatias.map((f) => (
                    <Cell key={f.chave} fill={f.cor} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(valor) => formatBRL(Number(valor))}
                  contentStyle={{
                    background: 'var(--glass-bg-thin)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'calc(var(--radius) * 0.6)',
                    fontSize: 12,
                    color: 'var(--fg)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="flex flex-col gap-1.5 text-sm">
            {FORMAS.map((f) => {
              const valor = dashboard.recebidoPorForma[f.chave];
              const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
              return (
                <li key={f.chave} className="flex items-center gap-2" data-testid={`forma-${f.chave}`}>
                  <span className="size-2.5 rounded-full shrink-0" style={{ background: f.cor }} aria-hidden />
                  <span className="text-muted-foreground">{f.rotulo}</span>
                  <span className="ml-auto tabular-nums font-semibold">{formatBRL(valor)}</span>
                  <span className="w-10 text-right tabular-nums text-xs text-muted-foreground">{pct}%</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
