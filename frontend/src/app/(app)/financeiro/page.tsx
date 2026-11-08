'use client';

import { Skeleton } from '@/components/ui/skeleton';
import {
  useDashboardFinanceiro,
  useVendasPorDia,
  type PeriodoFiltro,
} from '@/hooks/useFinanceiro';
import { formatBRL } from '@/lib/format';
import { PeriodSelector, usePeriodoFinanceiro } from './_components/period-selector';
import { RecebidoPorForma } from './_components/recebido-por-forma';
import { TresNumeros } from './_components/tres-numeros';
import { VendasPorDiaChart } from './_components/vendas-por-dia-chart';

export default function FinanceiroPage() {
  const { preselecao, periodo, custom, selecionar } = usePeriodoFinanceiro();
  const filtro: PeriodoFiltro = periodo;
  const dashboard = useDashboardFinanceiro(filtro);
  const porDia = useVendasPorDia(filtro);

  return (
    <div className="flex flex-col gap-3.5 pb-4">
      <PeriodSelector preselecao={preselecao} custom={custom} onSelecionar={selecionar} />

      <TresNumeros dashboard={dashboard.data} />

      <p className="text-xs text-muted-foreground" data-testid="nota-vendido-recebido">
        Vendido ≠ Recebido por design. A diferença é fiado em aberto.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3.5">
        <div className="lg:col-span-3">
          <VendasPorDiaChart dados={porDia.data} carregando={porDia.isLoading} />
        </div>
        <div className="lg:col-span-2">
          <RecebidoPorForma dashboard={dashboard.data} />
        </div>
      </div>

      <div className="glass p-4" data-testid="resumo-rodape">
        <h2 className="text-sm font-semibold tracking-tight">Resumo do período</h2>
        {dashboard.isLoading ? (
          <Skeleton className="mt-3 h-16 w-full" />
        ) : dashboard.data ? (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Contas a pagar · total</p>
              <p className="font-bold tabular-nums">{formatBRL(dashboard.data.contasAPagar.total)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contas a pagar · pago</p>
              <p className="font-bold tabular-nums">{formatBRL(dashboard.data.contasAPagar.pago)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contas a pagar · em aberto</p>
              <p className="font-bold tabular-nums">{formatBRL(dashboard.data.contasAPagar.emAberto)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vencidas</p>
              <p className="font-bold tabular-nums">
                {formatBRL(dashboard.data.contasAPagar.vencidas)}
                {dashboard.data.contasAPagar.vencidas > 0 && (
                  <span
                    className="ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ background: 'var(--danger-soft)', color: 'var(--danger-text)' }}
                    data-testid="badge-vencidas"
                  >
                    vencidas
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ticket médio · {dashboard.data.qtdVendas} vendas</p>
              <p className="font-bold tabular-nums">{formatBRL(dashboard.data.ticketMedio)}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
