export type PapelUsuario = 'SuperAdmin' | 'AdminLoja' | 'Funcionario';

export type FormaPagamento = 'Dinheiro' | 'Pix' | 'CartaoDebito' | 'CartaoCredito' | 'Outro';

export type TipoItemVenda = 'Produto' | 'Servico';

export type StatusVenda = 'Paga' | 'Parcial' | 'Pendente';

export type StatusCaixa = 'Aberto' | 'Fechado';

export interface LoginResponse {
  token: string;
  nome: string;
  papel: PapelUsuario;
  lojaId: string | null;
}

/** Espelha ProdutoDto do backend. */
export interface Produto {
  id: string;
  nome: string;
  modelo: string | null;
  cor: string | null;
  categoria: string | null;
  codigoBarras: string | null;
  precoVenda: number;
  custo: number;
  qtdEstoque: number;
  estoqueMinimo: number;
  observacoes: string | null;
  ativo: boolean;
  abaixoDoMinimo: boolean;
}

/** Espelha a resposta de GET /api/lojas/minha-loja. */
export interface Loja {
  id: string;
  nome: string;
  cnpj: string | null;
  ativa: boolean;
  criadaEm: string;
}

/** Espelha CaixaResumoDto (GET /api/caixa/atual). */
export interface CaixaResumo {
  id: string;
  dataAbertura: string;
  valorAbertura: number;
  entradas: number;
  saidas: number;
  saldoCalculado: number;
  qtdMovimentos: number;
  status: StatusCaixa;
}

/** Espelha ItemVendaRequest (POST /api/vendas). */
export interface ItemVendaInput {
  tipo: TipoItemVenda;
  produtoId?: string | null;
  descricao?: string | null;
  quantidade: number;
  precoUnitario?: number | null;
}

/** Espelha PagamentoRequest (POST /api/vendas). */
export interface PagamentoInput {
  forma: FormaPagamento;
  valor: number;
}

/** Espelha CriarVendaRequest (POST /api/vendas). */
export interface CriarVendaInput {
  cpfCliente?: string | null;
  observacoes?: string | null;
  itens: ItemVendaInput[];
  pagamentos: PagamentoInput[];
}

/** Espelha ItemVendaDto. */
export interface ItemVenda {
  id: string;
  tipo: TipoItemVenda;
  produtoId: string | null;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

/** Espelha PagamentoDto. */
export interface Pagamento {
  id: string;
  forma: FormaPagamento;
  valor: number;
  dataHora: string;
  usuarioId: string;
}

/** Espelha VendaDetalheDto (retornada em 201 na criação da venda). */
export interface VendaDetalhe {
  id: string;
  dataHora: string;
  total: number;
  status: StatusVenda;
  saldo: number;
  cpfCliente: string | null;
  usuarioId: string;
  observacoes: string | null;
  itens: ItemVenda[];
  pagamentos: Pagamento[];
}

export interface ApiErro {
  erro?: string;
}
