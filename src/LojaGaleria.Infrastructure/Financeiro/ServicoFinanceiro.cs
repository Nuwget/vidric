using LojaGaleria.Domain.Enums;
using LojaGaleria.Domain.Services;
using LojaGaleria.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LojaGaleria.Infrastructure.Financeiro;

public class ServicoFinanceiro
{
    private readonly AppDbContext _db;

    public ServicoFinanceiro(AppDbContext db) => _db = db;

    // Vendido != Recebido por design (competência vs. caixa); Em Aberto é acumulado, não do período.
    // SQLite não traduz Sum(decimal) — materializa e agrega no cliente. PostgreSQL (backlog) roda no servidor.
    public async Task<DashboardFinanceiro> DashboardAsync(DateTime inicio, DateTime fim, CancellationToken ct = default)
    {
        var vendasPeriodo = await _db.Vendas
            .Where(v => v.DataHora >= inicio && v.DataHora <= fim)
            .ToListAsync(ct);

        var pagamentosPeriodo = await _db.Pagamentos
            .Where(p => p.DataHora >= inicio && p.DataHora <= fim)
            .ToListAsync(ct);

        var todasAsVendas = await _db.Vendas
            .Include(v => v.Pagamentos)
            .ToListAsync(ct);

        var contas = await _db.ContasPagar.ToListAsync(ct);

        var vendido = vendasPeriodo.Sum(v => v.Total);
        var recebido = pagamentosPeriodo.Sum(p => p.Valor);
        var emAberto = todasAsVendas.Sum(v => v.Total - v.Pagamentos.Sum(p => p.Valor));

        var porForma = new Dictionary<string, decimal>
        {
            ["dinheiro"] = 0m,
            ["pix"] = 0m,
            ["cartaoDebito"] = 0m,
            ["cartaoCredito"] = 0m,
            ["outro"] = 0m
        };
        foreach (var pagamento in pagamentosPeriodo)
            porForma[ChaveForma(pagamento.Forma)] += pagamento.Valor;

        var hoje = DateTime.UtcNow.Date;
        var resumoContas = new ResumoContasPagar(
            contas.Sum(c => c.Valor),
            contas.Where(c => c.Pago).Sum(c => c.Valor),
            contas.Where(c => !c.Pago).Sum(c => c.Valor),
            contas.Where(c => !c.Pago && c.Vencimento.Date < hoje).Sum(c => c.Valor));

        var qtdVendas = vendasPeriodo.Count;
        var ticketMedio = qtdVendas > 0 ? Math.Round(vendido / qtdVendas, 2) : 0m;

        return new DashboardFinanceiro(
            new PeriodoFinanceiro(inicio, fim),
            vendido,
            recebido,
            emAberto,
            porForma,
            resumoContas,
            qtdVendas,
            ticketMedio);
    }

    public async Task<IReadOnlyList<VendaPorDia>> VendasPorDiaAsync(DateTime inicio, DateTime fim, CancellationToken ct = default)
    {
        var vendas = await _db.Vendas
            .Where(v => v.DataHora >= inicio && v.DataHora <= fim)
            .ToListAsync(ct);

        var pagamentos = await _db.Pagamentos
            .Where(p => p.DataHora >= inicio && p.DataHora <= fim)
            .ToListAsync(ct);

        var vendidoPorDia = vendas
            .GroupBy(v => v.DataHora.Date)
            .ToDictionary(g => g.Key, g => (total: g.Sum(v => v.Total), qtd: g.Count()));
        var recebidoPorDia = pagamentos
            .GroupBy(p => p.DataHora.Date)
            .ToDictionary(g => g.Key, g => g.Sum(p => p.Valor));

        var serie = new List<VendaPorDia>();
        for (var dia = inicio.Date; dia <= fim.Date; dia = dia.AddDays(1))
        {
            vendidoPorDia.TryGetValue(dia, out var v);
            recebidoPorDia.TryGetValue(dia, out var r);
            serie.Add(new VendaPorDia(dia, v.total, r, v.qtd));
        }

        return serie;
    }

    public async Task<FluxoCaixa> FluxoCaixaAsync(DateTime inicio, DateTime fim, CancellationToken ct = default)
    {
        var movimentos = await _db.MovimentosCaixa
            .Where(m => m.DataHora >= inicio && m.DataHora <= fim)
            .OrderBy(m => m.DataHora)
            .ToListAsync(ct);

        var itens = movimentos
            .Select(m => new MovimentoCaixaItem(
                m.Tipo.ToString(),
                m.Valor * RegrasCaixa.Sinal(m.Tipo),
                m.Descricao,
                m.DataHora,
                m.VendaId,
                m.ContaPagarId))
            .ToList();

        var entradas = itens.Where(i => i.Valor > 0).Sum(i => i.Valor);
        var saidas = itens.Where(i => i.Valor < 0).Sum(i => -i.Valor);

        return new FluxoCaixa(entradas, saidas, entradas - saidas, itens);
    }

    private static string ChaveForma(FormaPagamento forma) => forma switch
    {
        FormaPagamento.Dinheiro => "dinheiro",
        FormaPagamento.Pix => "pix",
        FormaPagamento.CartaoDebito => "cartaoDebito",
        FormaPagamento.CartaoCredito => "cartaoCredito",
        _ => "outro"
    };
}