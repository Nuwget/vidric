'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  DashboardFinanceiro,
  FluxoCaixa,
  RegistrarPagamentoInput,
  VendaAReceber,
  VendaPorDia,
} from '@/types/api';

export const CHAVE_FINANCEIRO_DASHBOARD = 'financeiro-dashboard';
export const CHAVE_VENDAS_POR_DIA = 'financeiro-vendas-por-dia';
export const CHAVE_FLUXO_CAIXA = 'financeiro-fluxo-caixa';
export const CHAVE_A_RECEBER = 'vendas-a-receber';

export interface PeriodoFiltro {
  dataInicio: string;
  dataFim: string;
}

export function useDashboardFinanceiro(periodo: PeriodoFiltro) {
  return useQuery<DashboardFinanceiro>({
    queryKey: [CHAVE_FINANCEIRO_DASHBOARD, periodo.dataInicio, periodo.dataFim],
    queryFn: async () =>
      (
        await api.get<DashboardFinanceiro>('/api/financeiro/dashboard', {
          params: { dataInicio: periodo.dataInicio, dataFim: periodo.dataFim },
        })
      ).data,
    staleTime: 15_000,
  });
}

export function useVendasPorDia(periodo: PeriodoFiltro) {
  return useQuery<VendaPorDia[]>({
    queryKey: [CHAVE_VENDAS_POR_DIA, periodo.dataInicio, periodo.dataFim],
    queryFn: async () =>
      (
        await api.get<VendaPorDia[]>('/api/financeiro/vendas-por-dia', {
          params: { dataInicio: periodo.dataInicio, dataFim: periodo.dataFim },
        })
      ).data,
    staleTime: 15_000,
  });
}

export function useFluxoCaixa(periodo: PeriodoFiltro) {
  return useQuery<FluxoCaixa>({
    queryKey: [CHAVE_FLUXO_CAIXA, periodo.dataInicio, periodo.dataFim],
    queryFn: async () =>
      (
        await api.get<FluxoCaixa>('/api/financeiro/fluxo-caixa', {
          params: { dataInicio: periodo.dataInicio, dataFim: periodo.dataFim },
        })
      ).data,
    staleTime: 15_000,
  });
}

/** Fiado em aberto — o backend já ordena do mais antigo para o mais novo. */
export function useAReceber() {
  return useQuery<VendaAReceber[]>({
    queryKey: [CHAVE_A_RECEBER],
    queryFn: async () => (await api.get<VendaAReceber[]>('/api/vendas/a-receber')).data,
    staleTime: 10_000,
  });
}

export function useRegistrarPagamento(vendaId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    { pagamento: unknown; venda: { saldo: number; status: string } },
    { response?: { data?: { erro?: string } }; message?: string },
    RegistrarPagamentoInput
  >({
    mutationFn: async (input) =>
      (await api.post(`/api/vendas/${vendaId}/pagamentos`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHAVE_A_RECEBER] });
      queryClient.invalidateQueries({ queryKey: [CHAVE_FINANCEIRO_DASHBOARD] });
      queryClient.invalidateQueries({ queryKey: [CHAVE_VENDAS_POR_DIA] });
      queryClient.invalidateQueries({ queryKey: [CHAVE_FLUXO_CAIXA] });
    },
  });
}
