'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CHAVE_PRODUTOS } from '@/hooks/useProdutos';
import type {
  AtualizarProdutoInput,
  CriarProdutoInput,
  EstoqueDashboard,
  Produto,
  ProdutoDetalhe,
  RegistrarMovimentoInput,
  RelatorioParados,
} from '@/types/api';

export const CHAVE_ESTOQUE_DASHBOARD = 'estoque-dashboard';
export const CHAVE_PRODUTO = 'produto';
export const CHAVE_PARADOS = 'produtos-parados';
export const CHAVE_ALERTAS = 'produtos-alertas';

export function useEstoqueDashboard() {
  return useQuery<EstoqueDashboard>({
    queryKey: [CHAVE_ESTOQUE_DASHBOARD],
    queryFn: async () => (await api.get<EstoqueDashboard>('/api/estoque/dashboard')).data,
    staleTime: 30_000,
  });
}

export function useProdutoDetalhe(id: string) {
  return useQuery<ProdutoDetalhe>({
    queryKey: [CHAVE_PRODUTO, id],
    queryFn: async () => (await api.get<ProdutoDetalhe>(`/api/produtos/${id}`)).data,
    enabled: Boolean(id),
  });
}

export function useAlertasAbaixoMinimo(enabled: boolean) {
  return useQuery<Produto[]>({
    queryKey: [CHAVE_ALERTAS],
    queryFn: async () => (await api.get<Produto[]>('/api/produtos/alertas/abaixo-minimo')).data,
    enabled,
    staleTime: 30_000,
  });
}

export function useProdutosParados(dias: number) {
  return useQuery<RelatorioParados>({
    queryKey: [CHAVE_PARADOS, dias],
    queryFn: async () =>
      (await api.get<RelatorioParados>('/api/produtos/relatorios/parados', { params: { dias } })).data,
    staleTime: 30_000,
  });
}

function useInvalidarEstoque() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    queryClient.invalidateQueries({ queryKey: [CHAVE_PRODUTOS] });
    queryClient.invalidateQueries({ queryKey: [CHAVE_ESTOQUE_DASHBOARD] });
    queryClient.invalidateQueries({ queryKey: [CHAVE_PARADOS] });
    queryClient.invalidateQueries({ queryKey: [CHAVE_ALERTAS] });
    if (id) queryClient.invalidateQueries({ queryKey: [CHAVE_PRODUTO, id] });
  };
}

export function useCriarProduto() {
  const invalidar = useInvalidarEstoque();
  return useMutation<Produto, unknown, CriarProdutoInput>({
    mutationFn: async (input) => (await api.post<Produto>('/api/produtos', input)).data,
    onSuccess: (produto) => invalidar(produto.id),
  });
}

export function useAtualizarProduto(id: string) {
  const invalidar = useInvalidarEstoque();
  return useMutation<Produto, unknown, AtualizarProdutoInput>({
    mutationFn: async (input) => (await api.put<Produto>(`/api/produtos/${id}`, input)).data,
    onSuccess: () => invalidar(id),
  });
}

export function useRegistrarMovimento(id: string) {
  const invalidar = useInvalidarEstoque();
  return useMutation<{ movimento: unknown; produto: Produto }, unknown, RegistrarMovimentoInput>({
    mutationFn: async (input) =>
      (await api.post(`/api/produtos/${id}/movimentos`, input)).data,
    onSuccess: () => invalidar(id),
  });
}

export function useAlternarAtivo() {
  const invalidar = useInvalidarEstoque();
  return useMutation<Produto, unknown, string>({
    mutationFn: async (id) => (await api.patch<Produto>(`/api/produtos/${id}/ativo`)).data,
    onSuccess: (produto) => invalidar(produto.id),
  });
}

export async function baixarCsvEstoque(): Promise<void> {
  const { data } = await api.get<Blob>('/api/produtos/exportar.csv', { responseType: 'blob' });
  const url = URL.createObjectURL(data);
  const ancora = document.createElement('a');
  ancora.href = url;
  ancora.download = 'estoque.csv';
  ancora.click();
  URL.revokeObjectURL(url);
}