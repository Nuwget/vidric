using LojaGaleria.Domain.Entities;
using LojaGaleria.Domain.Enums;
using LojaGaleria.Domain.Services;
using LojaGaleria.Domain.Tenancy;
using LojaGaleria.Infrastructure.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace LojaGaleria.Tests;

public class EstoqueTests : IDisposable
{
    private readonly SqliteConnection _connection;

    public EstoqueTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
        using var contexto = CriarContexto(null);
        contexto.Database.EnsureCreated();
    }

    public void Dispose() => _connection.Dispose();

    private AppDbContext CriarContexto(Guid? lojaId)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;
        return new AppDbContext(options, new TenantFake(lojaId));
    }

    private static Loja NovaLoja(Guid id) => new() { Id = id, Nome = $"Loja {id}" };

    [Fact]
    public void Criar_produto_com_estoque_inicial_gera_movimento_EntradaCompra()
    {
        var lojaId = Guid.NewGuid();
        using var db = CriarContexto(lojaId);
        db.Lojas.Add(NovaLoja(lojaId));

        var produto = new Produto { LojaId = lojaId, Nome = "Pelicula iPhone 15", PrecoVenda = 25m };
        db.Produtos.Add(produto);

        var movimento = ServicoEstoque.RegistrarMovimento(
            produto, TipoMovimentoEstoque.EntradaCompra, 10, Guid.NewGuid(), "Estoque inicial");
        db.MovimentosEstoque.Add(movimento);
        db.SaveChanges();

        Assert.Equal(10, produto.QtdEstoque);
        var salvo = db.MovimentosEstoque.Single();
        Assert.Equal(TipoMovimentoEstoque.EntradaCompra, salvo.Tipo);
        Assert.Equal("Estoque inicial", salvo.Motivo);
        Assert.Equal(10, salvo.Quantidade);
        Assert.Equal(produto.Id, salvo.ProdutoId);
    }

    [Fact]
    public void AjusteNegativo_insuficiente_lanca_excecao_e_preserva_estoque()
    {
        var lojaId = Guid.NewGuid();
        using var db = CriarContexto(lojaId);
        db.Lojas.Add(NovaLoja(lojaId));

        var produto = new Produto { LojaId = lojaId, Nome = "Capinha", PrecoVenda = 30m };
        db.Produtos.Add(produto);
        db.MovimentosEstoque.Add(ServicoEstoque.RegistrarMovimento(
            produto, TipoMovimentoEstoque.EntradaCompra, 5, Guid.NewGuid()));
        db.SaveChanges();

        Assert.Throws<InvalidOperationException>(() =>
            ServicoEstoque.RegistrarMovimento(produto, TipoMovimentoEstoque.AjusteNegativo, 100, Guid.NewGuid()));

        Assert.Equal(5, produto.QtdEstoque);
        Assert.Equal(5, db.Produtos.Single().QtdEstoque);
    }

    [Fact]
    public void Produto_da_loja_A_nao_aparece_na_listagem_da_loja_B()
    {
        var lojaA = Guid.NewGuid();
        var lojaB = Guid.NewGuid();

        using (var dbA = CriarContexto(lojaA))
        {
            dbA.Lojas.Add(NovaLoja(lojaA));
            dbA.Produtos.Add(new Produto { LojaId = lojaA, Nome = "Produto A", PrecoVenda = 10m });
            dbA.SaveChanges();
        }

        using (var dbB = CriarContexto(lojaB))
        {
            dbB.Lojas.Add(NovaLoja(lojaB));
            dbB.Produtos.Add(new Produto { LojaId = lojaB, Nome = "Produto B", PrecoVenda = 20m });
            dbB.SaveChanges();

            var visiveis = dbB.Produtos.ToList();
            Assert.Single(visiveis);
            Assert.Equal("Produto B", visiveis[0].Nome);
        }

        using var dbA2 = CriarContexto(lojaA);
        Assert.Equal("Produto A", dbA2.Produtos.Single().Nome);
    }

    private sealed class TenantFake : ITenantProvider
    {
        public TenantFake(Guid? lojaId) => LojaIdAtual = lojaId;
        public Guid? LojaIdAtual { get; }
        public bool EhSuperAdmin => false;
    }
}