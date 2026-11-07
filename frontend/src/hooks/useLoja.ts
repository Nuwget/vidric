'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Loja } from '@/types/api';

export function useMinhaLoja(enabled = true) {
  return useQuery<Loja>({
    queryKey: ['minha-loja'],
    queryFn: async () => {
      const { data } = await api.get<Loja>('/api/lojas/minha-loja');
      return data;
    },
    staleTime: 300_000,
    enabled,
    retry: false,
  });
}
