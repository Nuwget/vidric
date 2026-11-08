'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBRL } from '@/lib/format';
import type { VendaPorDia } from '@/types/api';

const COR_VENDIDO = 'var(--accent-text)';
const COR_RECEBIDO = '#3b82f6';

interface Props {
  dados?: VendaPorDia[];
  carregando: boolean;
}

function TooltipGlass({
  ativo,
  payload,
}: {
  ativo?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
}) {
  if (!ativo || !payload?.length) return null;
  return (
    <div
      className="glass p-3 text-xs"
      style={{ borderRadius: 'calc(var(--radius) * 0.6)', minWidth: 150 }}
    >
      {payload.map((p) => (
        <p key={p.name} className="flex items-center justify-between gap-3 py-0.5">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: p.color }} aria-hidden />
            {p.name}
          </span>
          <span className="tabular-nums font-semibold">{formatBRL(p.value ?? 0)}</span>
        </p>
      ))}
    </div>
  );
}

export function VendasPorDiaChart({ dados, carregando }: Props) {
  const serie = (dados ?? []).map((d) => ({
    ...d,
    // Data vem com componente de hora ("2026-11-07T00:00:00"); guarda o dia e
    // normaliza ao meio-dia para o toLocaleDateString não voltar um dia no UTC-3.
    dia: new Date(`${d.data.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }),
  }));

  return (
    <div className="glass p-4 flex flex-col gap-3" data-testid="grafico-vendas-por-dia">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">Vendas por dia</h2>
        <p className="text-xs text-muted-foreground">Vendido x recebido, dia a dia do período</p>
      </div>

      {carregando ? (
        <Skeleton className="h-[280px] w-full" />
      ) : (
        <>
          <div
            className="h-[280px] w-full"
            role="img"
            aria-label="Gráfico de linhas: vendido e recebido por dia do período. Dados completos na tabela abaixo."
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                <XAxis
                  dataKey="dia"
                  tick={{ fontSize: 11, fill: 'var(--muted)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--glass-border)' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--muted)' }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `R$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : formatBRL(v).replace(',00', '')
                  }
                />
                <Tooltip content={<TooltipGlass />} />
                <Line
                  type="monotone"
                  dataKey="vendido"
                  name="Vendido"
                  stroke={COR_VENDIDO}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: COR_VENDIDO }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="recebido"
                  name="Recebido"
                  stroke={COR_RECEBIDO}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: COR_RECEBIDO }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <table className="sr-only">
            <caption>Vendido e recebido por dia</caption>
            <thead>
              <tr>
                <th scope="col">Dia</th>
                <th scope="col">Vendido</th>
                <th scope="col">Recebido</th>
                <th scope="col">Vendas</th>
              </tr>
            </thead>
            <tbody>
              {serie.map((d) => (
                <tr key={d.data}>
                  <td>{d.dia}</td>
                  <td>{formatBRL(d.vendido)}</td>
                  <td>{formatBRL(d.recebido)}</td>
                  <td>{d.qtdVendas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: COR_VENDIDO }} aria-hidden />
          Vendido
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: COR_RECEBIDO }} aria-hidden />
          Recebido
        </span>
      </div>
    </div>
  );
}
