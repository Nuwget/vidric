import type { ItemVendaInput, Produto } from '@/types/api';

export const CATEGORIA_PELICULA = 'Película';
export const SERVICO_APLICACAO = { descricao: 'Aplicação de película', precoUnitario: 10 } as const;

export type ItemCarrinho =
  | { chave: string; tipo: 'Produto'; produto: Produto; quantidade: number }
  | { chave: string; tipo: 'Servico'; descricao: string; precoUnitario: number; quantidade: number };

export function novoItemProduto(produto: Produto): ItemCarrinho {
  return { chave: `Produto:${produto.id}`, tipo: 'Produto', produto, quantidade: 1 };
}

export function novoItemServico(
  descricao: string = SERVICO_APLICACAO.descricao,
  precoUnitario: number = SERVICO_APLICACAO.precoUnitario,
): ItemCarrinho {
  return { chave: `Servico:${descricao}`, tipo: 'Servico', descricao, precoUnitario, quantidade: 1 };
}

export function precoUnitario(item: ItemCarrinho): number {
  return item.tipo === 'Produto' ? item.produto.precoVenda : item.precoUnitario;
}

export function subtotal(item: ItemCarrinho): number {
  return round2(precoUnitario(item) * item.quantidade);
}

export function totalCarrinho(itens: ItemCarrinho[]): number {
  return round2(itens.reduce((acc, item) => acc + subtotal(item), 0));
}

export function adicionarItem(itens: ItemCarrinho[], item: ItemCarrinho): ItemCarrinho[] {
  const existente = itens.find((i) => i.chave === item.chave);
  if (!existente) return [...itens, item];
  return itens.map((i) => (i.chave === item.chave ? { ...i, quantidade: i.quantidade + item.quantidade } : i));
}

export function alterarQuantidade(itens: ItemCarrinho[], chave: string, delta: number): ItemCarrinho[] {
  return itens
    .map((i) => (i.chave === chave ? { ...i, quantidade: i.quantidade + delta } : i))
    .filter((i) => i.quantidade > 0);
}

export function removerItem(itens: ItemCarrinho[], chave: string): ItemCarrinho[] {
  return itens.filter((i) => i.chave !== chave);
}

/**
 * O backend calcula o preço do produto a partir do cadastro e exige precoUnitario
 * apenas nos itens de serviço.
 */
export function paraItensVenda(itens: ItemCarrinho[]): ItemVendaInput[] {
  return itens.map((item) =>
    item.tipo === 'Produto'
      ? { tipo: 'Produto' as const, produtoId: item.produto.id, quantidade: item.quantidade }
      : {
          tipo: 'Servico' as const,
          descricao: item.descricao,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
        },
  );
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
