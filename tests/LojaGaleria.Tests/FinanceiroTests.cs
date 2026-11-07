using LojaGaleria.Domain.Entities;
using LojaGaleria.Domain.Enums;
using LojaGaleria.Domain.Services;
using LojaGaleria.Domain.Tenancy;
using LojaGaleria.Infrastructure.Data;
using LojaGaleria.Infrastructure.Financeiro;
using LojaGaleria.Infrastructure.Vendas;
using Microsoft.EntityFrameworkCore;

namespace LojaGaleria.Tests;

public class FinanceiroTests : IDisposable
{
    private readonly string _dbPath;
    private readonly string _connectionString;

    public FinanceiroTests()
    {
        _dbPath = Path.Combine(Path.GetTempPath(), $"vidric-fin-{Guid.NewGuid():N}.db");
        _connectionString = $"Data Source={_dbPath};Default Timeout=30;Pooling=False";
        using var contexto = CriarContexto(null);
        contexto.Database.EnsureCreated();
    }

    public void Dispose()
    {
        foreach (var arquivo in new[] { _dbPath, _dbPath + "-shm", _dbPath + "-wal" })
            if (File.Exists(arquivo)) File.Delete(arquivo);
    }

    private AppDbContext CriarContexto(Guid? lojaId)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connectionString)
            .Options;
        return new AppDbContext(options, new TenantFake(lojaId));
    }

    private static Guid SeedProduto(AppDbContext db, Guid lojaId, string nome, int qtd, decimal preco)
    {
        db.Lojas.Add(new Loja { Id = lojaId, Nome = $"Loja {lojaId}" });
        var produto = new Produto { LojaId = lojaId, Nome = nome, PrecoVenda = preco, Custo = 1m };
        db.Produtos.Add(produto);
        if (qtd > 0)
            db.MovimentosEstoque.Add(ServicoEstoque.RegistrarMovimento(
                produto, TipoMovimentoEstoque.EntradaCompra, qtd, Guid.NewGuid(), "Estoque inicial"));
        db.SaveChanges();
        return produto.Id;
    }

    private static List<ItemVendaInput> ItemProduto(Guid produtoId, int qtd) =>
        new() { new ItemVendaInput(TipoItemVenda.Produto, produtoId, null, qtd, null) };

    private async Task<DashboardFinanceiro> Dashboard(Guid lojaId, DateTime inicio, DateTime fim)
    {
        using var db = CriarContexto(lojaId);
        return await new ServicoFinanceiro(db).DashboardAsync(inicio, fim);
    }

    [Fact]
    public async Task Vendido_e_recebido_separam_competencia_e_caixa_com_fiado()
    {
        var lojaId = Guid.NewGuid();
        Guid produtoId;
        using (var db = CriarContexto(lojaId))
            produtoId = SeedProduto(db, lojaId, "Produto", 5, 100m);

        Guid vendaId;
        using (var db = CriarContexto(lojaId))
        {
            var venda = await new ServicoVendas(db).CriarVendaAsync(lojaId, Guid.NewGuid(), null, null,
                ItemProduto(produtoId, 1),
                new List<PagamentoInput> { new(FormaPagamento.Pix, 60m) });
            vendaId = venda.Id;
            await new ServicoVendas(db).AdicionarPagamentoAsync(vendaId, Guid.NewGuid(), FormaPagamento.Pix, 40m);
        }

        using (var db = CriarContexto(lojaId))
        {
            var pagamanha = (await db.Pagamentos.Where(p => p.VendaId == vendaId).ToListAsync())
                .Single(p => p.Valor == 40m);
            pagamanha.DataHora = DateTime.UtcNow.AddDays(1);
            await db.SaveChangesAsync();
        }

        var hoje = DateTime.UtcNow;
        var dia1 = await Dashboard(lojaId, hoje.AddDays(-1), hoje.AddHours(12));
        Assert.Equal(100m, dia1.Vendido);
        Assert.Equal(60m, dia1.Recebido);
        Assert.Equal(0m, dia1.EmAberto);

        var dia2 = await Dashboard(lojaId, hoje.AddHours(12), hoje.AddDays(2));
        Assert.Equal(0m, dia2.Vendido);
        Assert.Equal(40m, dia2.Recebido);
        Assert.Equal(0m, dia2.EmAberto);
    }

    [Fact]
    public async Task EmAberto_e_acumulado_independente_do_periodo()
    {
        var lojaId = Guid.NewGuid();
        Guid produtoId;
        using (var db = CriarContexto(lojaId))
            produtoId = SeedProduto(db, lojaId, "Produto", 5, 100m);

        Guid vendaAntigaId;
        using (var db = CriarContexto(lojaId))
        {
            var venda = await new ServicoVendas(db).CriarVendaAsync(lojaId, Guid.NewGuid(), null, null,
                ItemProduto(produtoId, 1),
                new List<PagamentoInput> { new(FormaPagamento.Pix, 60m) });
            vendaAntigaId = venda.Id;
        }

        using (var db = CriarContexto(lojaId))
        {
            var antiga = await db.Vendas.Include(v => v.Pagamentos).SingleAsync(v => v.Id == vendaAntigaId);
            var corte = DateTime.UtcNow.AddDays(-40);
            antiga.DataHora = corte;
            foreach (var p in antiga.Pagamentos) p.DataHora = corte;
            await db.SaveChangesAsync();
        }

        using (var db = CriarContexto(lojaId))
            await new ServicoVendas(db).CriarVendaAsync(lojaId, Guid.NewGuid(), null, null,
                ItemProduto(produtoId, 2),
                new List<PagamentoInput> { new(FormaPagamento.Pix, 50m) });

        var agora = DateTime.UtcNow;
        var atual = await Dashboard(lojaId, agora.AddDays(-1), agora.AddDays(1));

        Assert.Equal(200m, atual.Vendido);
        Assert.Equal(50m, atual.Recebido);
        Assert.Equal(190m, atual.EmAberto);
    }

    [Fact]
    public async Task Segundo_caixa_aberto_gera_conflito()
    {
        var lojaId = Guid.NewGuid();
        using var db = CriarContexto(lojaId);
        var servico = new ServicoCaixa(db);
        await servico.AbrirAsync(lojaId, Guid.NewGuid(), 100m, null);
        await Assert.ThrowsAsync<ConflitoException>(() => servico.AbrirAsync(lojaId, Guid.NewGuid(), 50m, null));
    }

    [Fact]
    public async Task Venda_em_dinheiro_sem_caixa_aberto_e_rejeitada()
    {
        var lojaId = Guid.NewGuid();
        Guid produtoId;
        using (var db = CriarContexto(lojaId))
            produtoId = SeedProduto(db, lojaId, "Produto", 5, 50m);

        using var dbVenda = CriarContexto(lojaId);
        await Assert.ThrowsAsync<RegraVendaException>(() =>
            new ServicoVendas(dbVenda).CriarVendaAsync(lojaId, Guid.NewGuid(), null, null,
                ItemProduto(produtoId, 1),
                new List<PagamentoInput> { new(FormaPagamento.Dinheiro, 50m) }));
    }

    [Fact]
    public async Task Venda_em_dinheiro_com_caixa_aberto_gera_movimento_venda()
    {
        var lojaId = Guid.NewGuid();
        Guid produtoId;
        using (var db = CriarContexto(lojaId))
            produtoId = SeedProduto(db, lojaId, "Produto", 5, 50m);

        Guid caixaId;
        using (var db = CriarContexto(lojaId))
            caixaId = (await new ServicoCaixa(db).AbrirAsync(lojaId, Guid.NewGuid(), 100m, null)).Id;

        using (var db = CriarContexto(lojaId))
            await new ServicoVendas(db).CriarVendaAsync(lojaId, Guid.NewGuid(), null, null,
                ItemProduto(produtoId, 1),
                new List<PagamentoInput> { new(FormaPagamento.Dinheiro, 50m) });

        using var verificacao = CriarContexto(lojaId);
        var movimento = await verificacao.MovimentosCaixa
            .SingleAsync(m => m.Tipo == TipoMovimentoCaixa.VendaDinheiro);
        Assert.Equal(50m, movimento.Valor);
        Assert.Equal(caixaId, movimento.CaixaId);

        var resumo = await new ServicoCaixa(verificacao).ObterAtualAsync(lojaId);
        Assert.Equal(150m, resumo.SaldoCalculado);
    }

    [Fact]
    public async Task Fechamento_calcula_diferenca_corretamente()
    {
        var lojaId = Guid.NewGuid();
        Guid produtoId;
        using (var db = CriarContexto(lojaId))
            produtoId = SeedProduto(db, lojaId, "Produto", 5, 50m);

        Guid caixaId;
        using (var db = CriarContexto(lojaId))
            caixaId = (await new ServicoCaixa(db).AbrirAsync(lojaId, Guid.NewGuid(), 100m, null)).Id;

        using (var db = CriarContexto(lojaId))
            await new ServicoVendas(db).CriarVendaAsync(lojaId, Guid.NewGuid(), null, null,
                ItemProduto(produtoId, 1),
                new List<PagamentoInput> { new(FormaPagamento.Dinheiro, 50m) });

        using (var db = CriarContexto(lojaId))
            await new ServicoCaixa(db).SangriaAsync(caixaId, Guid.NewGuid(), 30m, "Retirada");

        using var fechamento = CriarContexto(lojaId);
        var caixa = await new ServicoCaixa(fechamento).FecharAsync(caixaId, Guid.NewGuid(), 118m, null);

        Assert.Equal(120m, caixa.ValorFechamentoCalculado);
        Assert.Equal(-2m, caixa.Diferenca);
        Assert.Equal(StatusCaixa.Fechado, caixa.Status);
    }

    [Fact]
    public async Task Fechamento_soma_multiplas_movimentacoes()
    {
        var lojaId = Guid.NewGuid();
        Guid produtoId;
        using (var db = CriarContexto(lojaId))
            produtoId = SeedProduto(db, lojaId, "Produto", 5, 50m);

        Guid caixaId;
        using (var db = CriarContexto(lojaId))
            caixaId = (await new ServicoCaixa(db).AbrirAsync(lojaId, Guid.NewGuid(), 100m, null)).Id;

        using (var db = CriarContexto(lojaId))
            await new ServicoVendas(db).CriarVendaAsync(lojaId, Guid.NewGuid(), null, null,
                ItemProduto(produtoId, 1),
                new List<PagamentoInput> { new(FormaPagamento.Dinheiro, 50m) });

        using (var db = CriarContexto(lojaId))
        {
            var caixaServico = new ServicoCaixa(db);
            await caixaServico.SuprimentoAsync(caixaId, Guid.NewGuid(), 20m, "Troco");
            await caixaServico.SangriaAsync(caixaId, Guid.NewGuid(), 30m, "Retirada");
        }

        Guid contaId;
        using (var db = CriarContexto(lojaId))
            contaId = (await new ServicoContasPagar(db).CriarAsync(lojaId, "Aluguel", "Aluguel", 40m,
                DateTime.UtcNow.AddDays(1), null)).Id;

        using (var db = CriarContexto(lojaId))
            await new ServicoContasPagar(db).PagarAsync(contaId, Guid.NewGuid(), FormaPagamento.Dinheiro);

        using var fechamento = CriarContexto(lojaId);
        var caixa = await new ServicoCaixa(fechamento).FecharAsync(caixaId, Guid.NewGuid(), 100m, null);

        Assert.Equal(100m, caixa.ValorFechamentoCalculado);
        Assert.Equal(0m, caixa.Diferenca);
    }

    [Fact]
    public async Task Conta_paga_em_dinheiro_gera_saida_e_reduz_caixa()
    {
        var lojaId = Guid.NewGuid();
        Guid caixaId;
        using (var db = CriarContexto(lojaId))
            caixaId = (await new ServicoCaixa(db).AbrirAsync(lojaId, Guid.NewGuid(), 100m, null)).Id;

        Guid contaId;
        using (var db = CriarContexto(lojaId))
            contaId = (await new ServicoContasPagar(db).CriarAsync(lojaId, "Fornecedor", "Fornecedor", 50m,
                DateTime.UtcNow.AddDays(5), null)).Id;

        using (var db = CriarContexto(lojaId))
            await new ServicoContasPagar(db).PagarAsync(contaId, Guid.NewGuid(), FormaPagamento.Dinheiro);

        using var verificacao = CriarContexto(lojaId);
        var conta = await verificacao.ContasPagar.SingleAsync(c => c.Id == contaId);
        Assert.True(conta.Pago);

        var movimento = await verificacao.MovimentosCaixa
            .SingleAsync(m => m.Tipo == TipoMovimentoCaixa.PagamentoConta);
        Assert.Equal(50m, movimento.Valor);
        Assert.Equal(caixaId, movimento.CaixaId);

        var resumo = await new ServicoCaixa(verificacao).ObterAtualAsync(lojaId);
        Assert.Equal(50m, resumo.SaldoCalculado);
    }

    [Fact]
    public async Task Caixa_e_conta_da_loja_A_nao_aparecem_para_loja_B()
    {
        var lojaA = Guid.NewGuid();
        var lojaB = Guid.NewGuid();

        using (var db = CriarContexto(lojaA))
        {
            db.Lojas.Add(new Loja { Id = lojaA, Nome = "Loja A" });
            await db.SaveChangesAsync();
            await new ServicoCaixa(db).AbrirAsync(lojaA, Guid.NewGuid(), 100m, null);
            await new ServicoContasPagar(db).CriarAsync(lojaA, "Aluguel", null, 200m,
                DateTime.UtcNow.AddDays(1), null);
        }

        using var dbB = CriarContexto(lojaB);
        Assert.Empty(dbB.Caixas.ToList());
        Assert.Empty(dbB.ContasPagar.ToList());
        Assert.Empty(dbB.MovimentosCaixa.ToList());
        await Assert.ThrowsAsync<EntidadeNaoEncontradaException>(() =>
            new ServicoCaixa(dbB).ObterAtualAsync(lojaB));
    }

    private sealed class TenantFake : ITenantProvider
    {
        public TenantFake(Guid? lojaId) => LojaIdAtual = lojaId;
        public Guid? LojaIdAtual { get; }
        public bool EhSuperAdmin => false;
    }
}