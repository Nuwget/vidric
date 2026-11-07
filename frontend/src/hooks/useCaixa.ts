'use client';

import { useQuery } from '@tanstack/react-query';
import { api, apiErrorStatus } from '@/lib/api';
import type { CaixaResumo } from '@/types/api';

export const CHAVE_CAIXA_ATUAL = 'caixa-atual';

/**
 * 404 significa "nenhum caixa aberto" — é um estado esperado do PDV, não um erro.
 */
export function useCaixaAtual(enabled = true) {
  const query = useQuery<CaixaResumo | null>({
    queryKey: [CHAVE_CAIXA_ATUAL],
    queryFn: async () => {
      try {
        const { data } = await api.get<CaixaResumo>('/api/caixa/atual');
        return data;
      } catch (error) {
        if (apiErrorStatus(error) === 404) return null;
        throw error;
      }
    },
    staleTime: 10_000,
    enabled,
    retry: false,
  });

  return {
    caixa: query.data ?? null,
    caixaAberto: query.data?.status === 'Aberto',
    carregando: query.isLoading,
  };
}
