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

export type TipoMovimentoEstoque =
  | 'EntradaCompra'
  | 'SaidaVenda'
  | 'AjustePositivo'
  | 'AjusteNegativo'
  | 'Perda'
  | 'Devolucao';

/** Espelha o item de movimentos de GET /api/produtos/{id}. */
export interface MovimentoEstoque {
  id: string;
  tipo: TipoMovimentoEstoque;
  quantidade: number;
  motivo: string | null;
  dataHora: string;
  usuarioId: string;
  vendaId?: string | null;
}

/** Espelha GET /api/produtos/{id} (produto + últimos 20 movimentos). */
export interface ProdutoDetalhe {
  produto: Produto;
  movimentos: MovimentoEstoque[];
}

export interface CategoriaEstoque {
  categoria: string;
  qtdProdutos: number;
  valorEstoque: number;
}

/** Espelha GET /api/estoque/dashboard. */
export interface EstoqueDashboard {
  totalProdutos: number;
  totalSkusZerados: number;
  totalSkusAbaixoMinimo: number;
  valorTotalEstoque: number;
  valorEstoqueParado: number;
  categorias: CategoriaEstoque[];
}

export interface ProdutoParado {
  produtoId: string;
  nome: string;
  modelo: string | null;
  cor: string | null;
  qtdEstoque: number;
  custo: number;
  valorImobilizado: number;
}

/** Espelha GET /api/produtos/relatorios/parados. */
export interface RelatorioParados {
  dias: number;
  vendasIndisponiveis: boolean;
  valorTotalImobilizado: number;
  itens: ProdutoParado[];
}

/** Espelha CriarProdutoRequest (POST /api/produtos). */
export interface CriarProdutoInput {
  nome: string;
  precoVenda: number;
  modelo?: string | null;
  cor?: string | null;
  categoria?: string | null;
  codigoBarras?: string | null;
  custo?: number;
  qtdEstoque?: number;
  estoqueMinimo?: number;
  observacoes?: string | null;
}

/** Espelha AtualizarProdutoRequest (PUT /api/produtos/{id}) — sem estoque. */
export interface AtualizarProdutoInput {
  nome: string;
  modelo?: string | null;
  cor?: string | null;
  categoria?: string | null;
  codigoBarras?: string | null;
  precoVenda: number;
  custo: number;
  estoqueMinimo: number;
  observacoes?: string | null;
  ativo: boolean;
}

/** Espelha RegistrarMovimentoRequest — SaidaVenda é reservada ao PDV. */
export interface RegistrarMovimentoInput {
  tipo: Exclude<TipoMovimentoEstoque, 'SaidaVenda'>;
  quantidade: number;
  motivo?: string | null;
}

/** Espelha ResumoContasPagar (ServicoFinanceiro). */
export interface ResumoContasPagar {
  total: number;
  pago: number;
  emAberto: number;
  vencidas: number;
}

/** Espelha DashboardFinanceiro — vendido ≠ recebido por design (competência vs. caixa). */
export interface DashboardFinanceiro {
  periodo: { dataInicio: string; dataFim: string };
  vendido: number;
  recebido: number;
  emAberto: number;
  recebidoPorForma: Record<'dinheiro' | 'pix' | 'cartaoDebito' | 'cartaoCredito' | 'outro', number>;
  contasAPagar: ResumoContasPagar;
  qtdVendas: number;
  ticketMedio: number;
}

/** Espelha VendaPorDia — série diária completa (dias sem venda vêm zerados). */
export interface VendaPorDia {
  data: string;
  vendido: number;
  recebido: number;
  qtdVendas: number;
}

/** Espelha MovimentoCaixaItem — valor já assinado pelo backend (positivo entrada). */
export interface MovimentoCaixaItem {
  tipo: string;
  valor: number;
  descricao: string | null;
  dataHora: string;
  vendaId: string | null;
  contaPagarId: string | null;
}

/** Espelha FluxoCaixa. */
export interface FluxoCaixa {
  entradas: number;
  saidas: number;
  saldo: number;
  movimentos: MovimentoCaixaItem[];
}

/** Espelha AReceberDto — fiado em aberto, mais antigo primeiro. */
export interface VendaAReceber {
  id: string;
  dataHora: string;
  cpfCliente: string | null;
  total: number;
  totalPago: number;
  saldo: number;
  status: StatusVenda;
}

/** Espelha PagamentoRequest (POST /api/vendas/{id}/pagamentos). */
export interface RegistrarPagamentoInput {
  forma: FormaPagamento;
  valor: number;
}
