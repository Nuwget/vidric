using LojaGaleria.Domain.Entities;

namespace LojaGaleria.Infrastructure.Financeiro;

public record ResumoCaixa(Caixa Caixa, decimal Entradas, decimal Saidas, decimal SaldoCalculado, int QtdMovimentos);

public record PeriodoFinanceiro(DateTime DataInicio, DateTime DataFim);

public record ResumoContasPagar(decimal Total, decimal Pago, decimal EmAberto, decimal Vencidas);

public record DashboardFinanceiro(
    PeriodoFinanceiro Periodo,
    decimal Vendido,
    decimal Recebido,
    decimal EmAberto,
    IReadOnlyDictionary<string, decimal> RecebidoPorForma,
    ResumoContasPagar ContasAPagar,
    int QtdVendas,
    decimal TicketMedio);

public record VendaPorDia(DateTime Data, decimal Vendido, decimal Recebido, int QtdVendas);

public record MovimentoCaixaItem(
    string Tipo,
    decimal Valor,
    string? Descricao,
    DateTime DataHora,
    Guid? VendaId,
    Guid? ContaPagarId);

public record FluxoCaixa(
    decimal Entradas,
    decimal Saidas,
    decimal Saldo,
    IReadOnlyList<MovimentoCaixaItem> Movimentos);