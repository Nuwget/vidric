'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Produto } from '@/types/api';

export interface FiltroProdutos {
  busca?: string;
  categoria?: string;
  pagina?: number;
  tamanho?: number;
  somenteAtivos?: boolean;
}

export const CHAVE_PRODUTOS = 'produtos';

export function useProdutos(filtro: FiltroProdutos, enabled = true) {
  const busca = (filtro.busca ?? '').trim();

  return useQuery<Produto[]>({
    queryKey: [
      CHAVE_PRODUTOS,
      {
        busca,
        categoria: filtro.categoria ?? null,
        pagina: filtro.pagina ?? 1,
        tamanho: filtro.tamanho ?? 20,
        somenteAtivos: filtro.somenteAtivos ?? true,
      },
    ],
    queryFn: async () => {
      const { data } = await api.get<Produto[]>('/api/produtos', {
        params: {
          ...(busca ? { busca } : {}),
          ...(filtro.categoria ? { categoria: filtro.categoria } : {}),
          pagina: filtro.pagina ?? 1,
          tamanho: filtro.tamanho ?? 20,
          somenteAtivos: filtro.somenteAtivos ?? true,
        },
      });
      return data;
    },
    staleTime: 30_000,
    enabled,
  });
}
