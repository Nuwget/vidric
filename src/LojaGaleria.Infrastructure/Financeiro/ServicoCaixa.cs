using LojaGaleria.Domain.Entities;
using LojaGaleria.Domain.Enums;
using LojaGaleria.Domain.Services;
using LojaGaleria.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LojaGaleria.Infrastructure.Financeiro;

public class ServicoCaixa
{
    private readonly AppDbContext _db;

    public ServicoCaixa(AppDbContext db) => _db = db;

    public async Task<Caixa> AbrirAsync(
        Guid lojaId, Guid usuarioId, decimal valorAbertura, string? observacoes, CancellationToken ct = default)
    {
        if (valorAbertura < 0)
            throw new RegraFinanceiraException("Valor de abertura não pode ser negativo.");

        var jaAberto = await _db.Caixas
            .FirstOrDefaultAsync(c => c.LojaId == lojaId && c.Status == StatusCaixa.Aberto, ct);
        if (jaAberto is not null)
            throw new ConflitoException("Já existe um caixa aberto. Feche-o antes de abrir outro.");

        var caixa = new Caixa
        {
            LojaId = lojaId,
            UsuarioAberturaId = usuarioId,
            ValorAbertura = valorAbertura,
            Observacoes = observacoes,
            Status = StatusCaixa.Aberto
        };
        _db.Caixas.Add(caixa);

        _db.MovimentosCaixa.Add(new MovimentoCaixa
        {
            LojaId = lojaId,
            CaixaId = caixa.Id,
            Tipo = TipoMovimentoCaixa.Abertura,
            Valor = valorAbertura,
            Descricao = "Abertura de caixa",
            UsuarioId = usuarioId
        });

        await _db.SaveChangesAsync(ct);
        return caixa;
    }

    public Task<Caixa?> ObterAbertoAsync(Guid lojaId, CancellationToken ct = default) =>
        _db.Caixas.FirstOrDefaultAsync(c => c.LojaId == lojaId && c.Status == StatusCaixa.Aberto, ct);

    public async Task<ResumoCaixa> ObterAtualAsync(Guid lojaId, CancellationToken ct = default)
    {
        var caixa = await _db.Caixas
            .Include(c => c.Movimentos)
            .FirstOrDefaultAsync(c => c.LojaId == lojaId && c.Status == StatusCaixa.Aberto, ct);
        if (caixa is null)
            throw new EntidadeNaoEncontradaException("Nenhum caixa aberto.");

        return CalcularResumo(caixa);
    }

    public Task<MovimentoCaixa> SangriaAsync(Guid caixaId, Guid usuarioId, decimal valor, string? descricao, CancellationToken ct = default) =>
        AdicionarMovimentoAsync(caixaId, usuarioId, TipoMovimentoCaixa.Sangria, valor, descricao, ct);

    public Task<MovimentoCaixa> SuprimentoAsync(Guid caixaId, Guid usuarioId, decimal valor, string? descricao, CancellationToken ct = default) =>
        AdicionarMovimentoAsync(caixaId, usuarioId, TipoMovimentoCaixa.Suprimento, valor, descricao, ct);

    public async Task<Caixa> FecharAsync(Guid caixaId, Guid usuarioId, decimal valorInformado, string? observacoes, CancellationToken ct = default)
    {
        var caixa = await _db.Caixas
            .Include(c => c.Movimentos)
            .FirstOrDefaultAsync(c => c.Id == caixaId, ct);
        if (caixa is null)
            throw new EntidadeNaoEncontradaException("Caixa não encontrado.");
        if (caixa.Status == StatusCaixa.Fechado)
            throw new ConflitoException("Caixa já está fechado.");

        var resumo = CalcularResumo(caixa);
        caixa.ValorFechamentoInformado = valorInformado;
        caixa.ValorFechamentoCalculado = resumo.SaldoCalculado;
        caixa.Diferenca = valorInformado - resumo.SaldoCalculado;
        caixa.Status = StatusCaixa.Fechado;
        caixa.DataFechamento = DateTime.UtcNow;
        caixa.UsuarioFechamentoId = usuarioId;
        if (observacoes is not null)
            caixa.Observacoes = observacoes;

        await _db.SaveChangesAsync(ct);
        return caixa;
    }

    public async Task<Caixa> ObterDetalheAsync(Guid caixaId, CancellationToken ct = default)
    {
        var caixa = await _db.Caixas
            .Include(c => c.Movimentos)
            .FirstOrDefaultAsync(c => c.Id == caixaId, ct);
        if (caixa is null)
            throw new EntidadeNaoEncontradaException("Caixa não encontrado.");
        return caixa;
    }

    public async Task<IReadOnlyList<ResumoCaixa>> HistoricoAsync(DateTime inicio, DateTime fim, CancellationToken ct = default)
    {
        var caixas = await _db.Caixas
            .Include(c => c.Movimentos)
            .Where(c => c.Status == StatusCaixa.Fechado
                && c.DataAbertura >= inicio && c.DataAbertura <= fim)
            .OrderBy(c => c.DataAbertura)
            .ToListAsync(ct);

        return caixas.Select(CalcularResumo).ToList();
    }

    // SQLite não traduz Sum em decimal; soma no cliente sobre a coleção já materializada.
    // No PostgreSQL (backlog de migração) isto volta a rodar no servidor.
    public static ResumoCaixa CalcularResumo(Caixa caixa)
    {
        decimal entradas = 0m, saidas = 0m;
        foreach (var movimento in caixa.Movimentos)
        {
            if (RegrasCaixa.EhEntrada(movimento.Tipo))
                entradas += movimento.Valor;
            else
                saidas += movimento.Valor;
        }

        return new ResumoCaixa(caixa, entradas, saidas, entradas - saidas, caixa.Movimentos.Count);
    }

    private async Task<MovimentoCaixa> AdicionarMovimentoAsync(
        Guid caixaId, Guid usuarioId, TipoMovimentoCaixa tipo, decimal valor, string? descricao, CancellationToken ct)
    {
        if (valor <= 0)
            throw new RegraFinanceiraException("Valor deve ser maior que zero.");

        var caixa = await _db.Caixas.FirstOrDefaultAsync(c => c.Id == caixaId, ct);
        if (caixa is null)
            throw new EntidadeNaoEncontradaException("Caixa não encontrado.");
        if (caixa.Status == StatusCaixa.Fechado)
            throw new ConflitoException("Caixa fechado não aceita mais movimentos.");

        var movimento = new MovimentoCaixa
        {
            LojaId = caixa.LojaId,
            CaixaId = caixa.Id,
            Tipo = tipo,
            Valor = valor,
            Descricao = descricao,
            UsuarioId = usuarioId
        };
        _db.MovimentosCaixa.Add(movimento);

        await _db.SaveChangesAsync(ct);
        return movimento;
    }
}