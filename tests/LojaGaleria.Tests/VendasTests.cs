using LojaGaleria.Domain.Entities;
using LojaGaleria.Domain.Enums;
using LojaGaleria.Domain.Services;
using LojaGaleria.Domain.Tenancy;
using LojaGaleria.Infrastructure.Data;
using LojaGaleria.Infrastructure.Vendas;
using Microsoft.EntityFrameworkCore;

namespace LojaGaleria.Tests;

public class VendasTests : IDisposable
{
    private readonly string _dbPath;
    private readonly string _connectionString;

    public VendasTests()
    {
        _dbPath = Path.Combine(Path.GetTempPath(), $"vidric-tests-{Guid.NewGuid():N}.db");
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

    [Fact]
    public async Task Concorrencia_na_ultima_unidade_gera_um_sucesso_e_um_conflito()
    {
        var lojaId = Guid.NewGuid();
        Guid produtoId;
        using (var db = CriarContexto(lojaId))
            produtoId = SeedProduto(db, lojaId, "Capinha iPhone 15 Preta", 1, 50m);

        async Task<(bool Ok, Exception? Erro)> TentarVenda()
        {
            using var db = CriarContexto(lojaId);
            var servico = new ServicoVendas(db);
            try
            {
                await servico.CriarVendaAsync(lojaId, Guid.NewGuid(), null, null,
                    ItemProduto(produtoId, 1),
                    new List<PagamentoInput> { new(FormaPagamento.Pix, 50m) });
                return (true, null);
            }
            catch (Exception ex)
            {
                return (false, ex);
            }
        }

        var resultados = await Task.WhenAll(TentarVenda(), TentarVenda());

        Assert.Equal(1, resultados.Count(r => r.Ok));
        Assert.IsType<EstoqueInsuficienteException>(resultados.Single(r => !r.Ok).Erro);

        using var verificacao = CriarContexto(lojaId);
        Assert.Equal(0, verificacao.Produtos.Single().QtdEstoque);
        Assert.Equal(1, verificacao.Vendas.Count());
        Assert.Equal(1, verificacao.MovimentosEstoque.Count(m => m.Tipo == TipoMovimentoEstoque.SaidaVenda));
    }

    [Fact]
    public async Task Pagamento_parcial_gera_status_parcial_e_saldo_calculado()
    {
        var lojaId = Guid.NewGuid();
        Guid produtoId;
        using (var db = CriarContexto(lojaId))
            produtoId = SeedProduto(db, lojaId, "Pelicula", 5, 100m);

        Guid vendaId;
        using (var db = CriarContexto(lojaId))
        {
            var venda = await new ServicoVendas(db).CriarVendaAsync(lojaId, Guid.NewGuid(), null, null,
                ItemProduto(produtoId, 1),
                new List<PagamentoInput> { new(FormaPagamento.Pix, 60m) });
            vendaId = venda.Id;
            Assert.Equal(StatusVenda.Parcial, venda.Status);
            Assert.Equal(40m, venda.Total - venda.Pagamentos.Sum(p => p.Valor));
        }

        using (var db = CriarContexto(lojaId))
        {
            var (_, venda) = await new ServicoVendas(db).AdicionarPagamentoAsync(vendaId, Guid.NewGuid(), FormaPagamento.Dinheiro, 40m);
            Assert.Equal(StatusVenda.Paga, venda.Status);
            Assert.Equal(0m, venda.Total - venda.Pagamentos.Sum(p => p.Valor));
        }
    }

    [Fact]
    public async Task Overpayment_e_rejeitado_e_preserva_total_pago()
    {
        var lojaId = Guid.NewGuid();
        Guid produtoId;
        using (var db = CriarContexto(lojaId))
            produtoId = SeedProduto(db, lojaId, "Pelicula", 5, 100m);

        Guid vendaId;
        using (var db = CriarContexto(lojaId))
        {
            var venda = await new ServicoVendas(db).CriarVendaAsync(lojaId, Guid.NewGuid(), null, null,
                ItemProduto(produtoId, 1),
                new List<PagamentoInput> { new(FormaPagamento.Pix, 60m) });
            vendaId = venda.Id;
        }

        using (var db = CriarContexto(lojaId))
        {
            await Assert.ThrowsAsync<RegraVendaException>(() =>
                new ServicoVendas(db).AdicionarPagamentoAsync(vendaId, Guid.NewGuid(), FormaPagamento.Dinheiro, 50m));
        }

        using var verificacao = CriarContexto(lojaId);
        var vendaFinal = verificacao.Vendas.Include(v => v.Pagamentos).Single();
        Assert.Equal(60m, vendaFinal.Pagamentos.Sum(p => p.Valor));
        Assert.Equal(StatusVenda.Parcial, vendaFinal.Status);
    }

    [Fact]
    public async Task Produto_vendido_sai_da_lista_de_parados()
    {
        var lojaId = Guid.NewGuid();
        Guid produtoId;
        using (var db = CriarContexto(lojaId))
            produtoId = SeedProduto(db, lojaId, "Capinha", 3, 30m);

        using (var db = CriarContexto(lojaId))
            Assert.Contains(produtoId, await Parados(db));

        using (var db = CriarContexto(lojaId))
            await new ServicoVendas(db).CriarVendaAsync(lojaId, Guid.NewGuid(), null, null,
                ItemProduto(produtoId, 1),
                new List<PagamentoInput> { new(FormaPagamento.Pix, 30m) });

        using (var db = CriarContexto(lojaId))
            Assert.DoesNotContain(produtoId, await Parados(db));
    }

    [Fact]
    public async Task Venda_da_loja_A_nao_aparece_para_loja_B()
    {
        var lojaA = Guid.NewGuid();
        var lojaB = Guid.NewGuid();
        Guid produtoA;
        using (var db = CriarContexto(lojaA))
        {
            produtoA = SeedProduto(db, lojaA, "Produto A", 5, 20m);
            await new ServicoVendas(db).CriarVendaAsync(lojaA, Guid.NewGuid(), null, null,
                ItemProduto(produtoA, 1), new List<PagamentoInput>());
        }

        using (var dbB = CriarContexto(lojaB))
        {
            dbB.Lojas.Add(new Loja { Id = lojaB, Nome = "Loja B" });
            dbB.SaveChanges();
            Assert.Empty(dbB.Vendas.ToList());
            Assert.Empty(dbB.Vendas.Where(v => v.Status == StatusVenda.Pendente).ToList());
        }

        using var dbA = CriarContexto(lojaA);
        Assert.Single(dbA.Vendas.ToList());
    }

    [Fact]
    public async Task Venda_apenas_de_servico_nao_cria_movimento_de_estoque()
    {
        var lojaId = Guid.NewGuid();
        using (var db = CriarContexto(lojaId))
            SeedProduto(db, lojaId, "Pelicula", 5, 25m);

        using (var db = CriarContexto(lojaId))
        {
            var venda = await new ServicoVendas(db).CriarVendaAsync(lojaId, Guid.NewGuid(), null, null,
                new List<ItemVendaInput>
                {
                    new(TipoItemVenda.Servico, null, "Aplicação de película", 1, 10m)
                },
                new List<PagamentoInput> { new(FormaPagamento.Dinheiro, 10m) });
            Assert.Equal(StatusVenda.Paga, venda.Status);
        }

        using var verificacao = CriarContexto(lojaId);
        Assert.Equal(5, verificacao.Produtos.Single().QtdEstoque);
        Assert.Empty(verificacao.MovimentosEstoque.Where(m => m.Tipo == TipoMovimentoEstoque.SaidaVenda).ToList());
    }

    private static Task<List<Guid>> Parados(AppDbContext db)
    {
        var corte = DateTime.UtcNow.AddDays(-30);
        return db.Produtos
            .Where(p => p.Ativo && p.QtdEstoque > 0)
            .Where(p => !db.MovimentosEstoque.Any(m => m.ProdutoId == p.Id
                && m.Tipo == TipoMovimentoEstoque.SaidaVenda && m.DataHora >= corte))
            .Select(p => p.Id)
            .ToListAsync();
    }

    private sealed class TenantFake : ITenantProvider
    {
        public TenantFake(Guid? lojaId) => LojaIdAtual = lojaId;
        public Guid? LojaIdAtual { get; }
        public bool EhSuperAdmin => false;
    }
}