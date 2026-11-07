using LojaGaleria.Domain.Entities;
using LojaGaleria.Domain.Enums;
using LojaGaleria.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LojaGaleria.Infrastructure.Financeiro;

public class ServicoContasPagar
{
    private readonly AppDbContext _db;

    public ServicoContasPagar(AppDbContext db) => _db = db;

    public async Task<ContaPagar> CriarAsync(
        Guid lojaId, string descricao, string? categoria, decimal valor, DateTime vencimento, string? observacoes,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(descricao))
            throw new RegraFinanceiraException("Descrição é obrigatória.");
        if (valor <= 0)
            throw new RegraFinanceiraException("Valor da conta deve ser maior que zero.");

        var conta = new ContaPagar
        {
            LojaId = lojaId,
            Descricao = descricao.Trim(),
            Categoria = string.IsNullOrWhiteSpace(categoria) ? null : categoria.Trim(),
            Valor = valor,
            Vencimento = NormalizarVencimento(vencimento),
            Observacoes = observacoes
        };
        _db.ContasPagar.Add(conta);

        await _db.SaveChangesAsync(ct);
        return conta;
    }

    public async Task<ContaPagar> PagarAsync(Guid contaId, Guid usuarioId, FormaPagamento forma, CancellationToken ct = default)
    {
        var conta = await _db.ContasPagar.FirstOrDefaultAsync(c => c.Id == contaId, ct);
        if (conta is null)
            throw new EntidadeNaoEncontradaException("Conta não encontrada.");
        if (conta.Pago)
            throw new RegraFinanceiraException("Conta já está paga.");

        if (forma == FormaPagamento.Dinheiro)
        {
            var caixa = await _db.Caixas
                .FirstOrDefaultAsync(c => c.LojaId == conta.LojaId && c.Status == StatusCaixa.Aberto, ct);
            if (caixa is null)
                throw new RegraFinanceiraException("Abra o caixa antes de pagar em dinheiro.");

            _db.MovimentosCaixa.Add(new MovimentoCaixa
            {
                LojaId = conta.LojaId,
                CaixaId = caixa.Id,
                Tipo = TipoMovimentoCaixa.PagamentoConta,
                Valor = conta.Valor,
                Descricao = $"Pagamento: {conta.Descricao}",
                UsuarioId = usuarioId,
                ContaPagarId = conta.Id
            });
        }

        conta.Pago = true;
        conta.DataPagamento = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return conta;
    }

    public async Task<ContaPagar> AtualizarAsync(
        Guid contaId, string descricao, string? categoria, decimal valor, DateTime vencimento, string? observacoes,
        CancellationToken ct = default)
    {
        var conta = await _db.ContasPagar.FirstOrDefaultAsync(c => c.Id == contaId, ct);
        if (conta is null)
            throw new EntidadeNaoEncontradaException("Conta não encontrada.");
        if (string.IsNullOrWhiteSpace(descricao))
            throw new RegraFinanceiraException("Descrição é obrigatória.");
        if (valor <= 0)
            throw new RegraFinanceiraException("Valor da conta deve ser maior que zero.");

        conta.Descricao = descricao.Trim();
        conta.Categoria = string.IsNullOrWhiteSpace(categoria) ? null : categoria.Trim();
        conta.Valor = valor;
        conta.Vencimento = NormalizarVencimento(vencimento);
        conta.Observacoes = observacoes;

        await _db.SaveChangesAsync(ct);
        return conta;
    }

    public async Task ExcluirAsync(Guid contaId, CancellationToken ct = default)
    {
        var conta = await _db.ContasPagar.FirstOrDefaultAsync(c => c.Id == contaId, ct);
        if (conta is null)
            throw new EntidadeNaoEncontradaException("Conta não encontrada.");
        if (conta.Pago)
            throw new ConflitoException("Não é possível excluir conta já paga. Estorne primeiro (funcionalidade futura).");

        _db.ContasPagar.Remove(conta);
        await _db.SaveChangesAsync(ct);
    }

    // Vencimento é data: armazena meio-dia UTC para não deslocar por fuso horário.
    private static DateTime NormalizarVencimento(DateTime vencimento) =>
        DateTime.SpecifyKind(vencimento.Date.AddHours(12), DateTimeKind.Utc);
}