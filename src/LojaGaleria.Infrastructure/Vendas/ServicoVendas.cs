using LojaGaleria.Domain.Entities;
using LojaGaleria.Domain.Enums;
using LojaGaleria.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LojaGaleria.Infrastructure.Vendas;

public class RegraVendaException : Exception
{
    public RegraVendaException(string message) : base(message) { }
}

public class EstoqueInsuficienteException : Exception
{
    public EstoqueInsuficienteException(string message) : base(message) { }
}

public record ItemVendaInput(
    TipoItemVenda Tipo,
    Guid? ProdutoId,
    string? Descricao,
    int Quantidade,
    decimal? PrecoUnitario);

public record PagamentoInput(FormaPagamento Forma, decimal Valor);

public class ServicoVendas
{
    private readonly AppDbContext _db;

    public ServicoVendas(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Venda> CriarVendaAsync(
        Guid lojaId,
        Guid usuarioId,
        string? cpfCliente,
        string? observacoes,
        IReadOnlyList<ItemVendaInput> itens,
        IReadOnlyList<PagamentoInput> pagamentos,
        CancellationToken ct = default)
    {
        if (itens.Count == 0)
            throw new RegraVendaException("A venda exige ao menos um item.");

        if (cpfCliente is not null &&
            (cpfCliente.Length != 11 || !cpfCliente.All(char.IsDigit)))
            throw new RegraVendaException("CPF deve conter exatamente 11 dígitos numéricos.");

        await using var transacao = await _db.Database.BeginTransactionAsync(ct);

        var venda = new Venda
        {
            LojaId = lojaId,
            UsuarioId = usuarioId,
            CpfCliente = cpfCliente,
            Observacoes = observacoes
        };
        _db.Vendas.Add(venda);

        decimal total = 0m;
        foreach (var item in itens)
        {
            if (item.Quantidade <= 0)
                throw new RegraVendaException("Quantidade do item deve ser maior que zero.");

            ItemVenda registro;
            if (item.Tipo == TipoItemVenda.Produto)
            {
                if (item.ProdutoId is null)
                    throw new RegraVendaException("Item do tipo Produto exige produtoId.");

                var produto = await _db.Produtos.FirstOrDefaultAsync(p => p.Id == item.ProdutoId, ct);
                if (produto is null)
                    throw new RegraVendaException("Produto não encontrado nesta loja.");
                if (!produto.Ativo)
                    throw new RegraVendaException($"Produto '{produto.Nome}' está inativo e não pode ser vendido.");
                if (produto.PrecoVenda < 0)
                    throw new RegraVendaException("Preço de venda do produto não pode ser negativo.");

                await BaixarEstoqueAtomicoAsync(produto.Id, lojaId, produto.Nome, item.Quantidade, ct);

                _db.MovimentosEstoque.Add(new MovimentoEstoque
                {
                    LojaId = lojaId,
                    ProdutoId = produto.Id,
                    Tipo = TipoMovimentoEstoque.SaidaVenda,
                    Quantidade = item.Quantidade,
                    Motivo = "Venda PDV",
                    UsuarioId = usuarioId,
                    VendaId = venda.Id
                });

                registro = new ItemVenda
                {
                    LojaId = lojaId,
                    VendaId = venda.Id,
                    Tipo = TipoItemVenda.Produto,
                    ProdutoId = produto.Id,
                    Descricao = produto.Nome,
                    Quantidade = item.Quantidade,
                    PrecoUnitario = produto.PrecoVenda
                };
            }
            else
            {
                if (item.ProdutoId is not null)
                    throw new RegraVendaException("Item do tipo Servico não pode ter produtoId.");
                if (string.IsNullOrWhiteSpace(item.Descricao))
                    throw new RegraVendaException("Item do tipo Servico exige descricao.");
                if (item.PrecoUnitario is null || item.PrecoUnitario < 0)
                    throw new RegraVendaException("Item do tipo Servico exige precoUnitario não negativo.");

                registro = new ItemVenda
                {
                    LojaId = lojaId,
                    VendaId = venda.Id,
                    Tipo = TipoItemVenda.Servico,
                    Descricao = item.Descricao.Trim(),
                    Quantidade = item.Quantidade,
                    PrecoUnitario = item.PrecoUnitario.Value
                };
            }

            registro.Subtotal = registro.Quantidade * registro.PrecoUnitario;
            total += registro.Subtotal;
            _db.ItemVendas.Add(registro);
        }

        venda.Total = total;

        Caixa? caixaAberto = null;
        if (pagamentos.Any(p => p.Forma == FormaPagamento.Dinheiro))
            caixaAberto = await ExigirCaixaAbertoAsync(lojaId, "Abra o caixa antes de vender em dinheiro.", ct);

        decimal totalPago = 0m;
        foreach (var pagamento in pagamentos)
        {
            if (pagamento.Valor <= 0)
                throw new RegraVendaException("Valor do pagamento deve ser maior que zero.");

            totalPago += pagamento.Valor;
            if (totalPago > venda.Total)
                throw new RegraVendaException("Pagamento excede o total da venda.");

            var registro = new Pagamento
            {
                LojaId = lojaId,
                VendaId = venda.Id,
                Forma = pagamento.Forma,
                Valor = pagamento.Valor,
                UsuarioId = usuarioId
            };
            _db.Pagamentos.Add(registro);

            if (pagamento.Forma == FormaPagamento.Dinheiro)
            {
                _db.MovimentosCaixa.Add(new MovimentoCaixa
                {
                    LojaId = lojaId,
                    CaixaId = caixaAberto!.Id,
                    Tipo = TipoMovimentoCaixa.VendaDinheiro,
                    Valor = pagamento.Valor,
                    Descricao = "Venda PDV",
                    UsuarioId = usuarioId,
                    VendaId = venda.Id
                });
            }
        }

        venda.Status = CalcularStatus(venda.Total, totalPago);

        await _db.SaveChangesAsync(ct);
        await transacao.CommitAsync(ct);
        return venda;
    }

    public async Task<(Pagamento Pagamento, Venda Venda)> AdicionarPagamentoAsync(
        Guid vendaId,
        Guid usuarioId,
        FormaPagamento forma,
        decimal valor,
        CancellationToken ct = default)
    {
        if (valor <= 0)
            throw new RegraVendaException("Valor do pagamento deve ser maior que zero.");

        var venda = await _db.Vendas
            .Include(v => v.Pagamentos)
            .Include(v => v.Itens)
            .FirstOrDefaultAsync(v => v.Id == vendaId, ct);
        if (venda is null)
            throw new RegraVendaException("Venda não encontrada.");

        var totalPago = venda.Pagamentos.Sum(p => p.Valor);
        if (totalPago + valor > venda.Total)
            throw new RegraVendaException("Pagamento excede o saldo da venda.");

        Caixa? caixaAberto = null;
        if (forma == FormaPagamento.Dinheiro)
            caixaAberto = await ExigirCaixaAbertoAsync(venda.LojaId, "Abra o caixa antes de receber em dinheiro.", ct);

        var pagamento = new Pagamento
        {
            LojaId = venda.LojaId,
            VendaId = venda.Id,
            Forma = forma,
            Valor = valor,
            UsuarioId = usuarioId
        };
        _db.Pagamentos.Add(pagamento);

        if (forma == FormaPagamento.Dinheiro)
        {
            _db.MovimentosCaixa.Add(new MovimentoCaixa
            {
                LojaId = venda.LojaId,
                CaixaId = caixaAberto!.Id,
                Tipo = TipoMovimentoCaixa.VendaDinheiro,
                Valor = valor,
                Descricao = "Recebimento de venda",
                UsuarioId = usuarioId,
                VendaId = venda.Id
            });
        }

        venda.Status = CalcularStatus(venda.Total, totalPago + valor);

        await _db.SaveChangesAsync(ct);
        return (pagamento, venda);
    }

    private async Task<Caixa> ExigirCaixaAbertoAsync(Guid lojaId, string mensagem, CancellationToken ct)
    {
        var caixa = await _db.Caixas
            .FirstOrDefaultAsync(c => c.LojaId == lojaId && c.Status == StatusCaixa.Aberto, ct);
        if (caixa is null)
            throw new RegraVendaException(mensagem);
        return caixa;
    }

    public static StatusVenda CalcularStatus(decimal total, decimal totalPago) =>
        totalPago >= total ? StatusVenda.Paga
        : totalPago == 0m ? StatusVenda.Pendente
        : StatusVenda.Parcial;

    private async Task BaixarEstoqueAtomicoAsync(Guid produtoId, Guid lojaId, string descricao, int quantidade, CancellationToken ct)
    {
        // UPDATE condicional atômico: se outro operador baixou a última unidade primeiro,
        // a cláusula QtdEstoque >= quantidade não casa e nenhum row é afetado.
        var afetados = await _db.Database.ExecuteSqlInterpolatedAsync(
            $@"UPDATE Produtos
               SET QtdEstoque = QtdEstoque - {quantidade}, AtualizadoEm = {DateTime.UtcNow}
               WHERE Id = {produtoId} AND LojaId = {lojaId} AND QtdEstoque >= {quantidade}",
            ct);

        if (afetados != 1)
            throw new EstoqueInsuficienteException(
                $"Estoque insuficiente para o produto '{descricao}'. Outro operador pode ter finalizado a última unidade.");
    }
}