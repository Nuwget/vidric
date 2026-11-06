using LojaGaleria.Domain.Enums;
using LojaGaleria.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LojaGaleria.API.Controllers;

[ApiController]
[Route("api/estoque/dashboard")]
[Authorize(Policy = "LojaUser")]
public class EstoqueDashboardController : ControllerBase
{
    private readonly AppDbContext _db;

    public EstoqueDashboardController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Obter()
    {
        // SQLite não traduz SUM/GROUP BY de decimal; agregados calculados no cliente.
        var ativos = await _db.Produtos.Where(p => p.Ativo).ToListAsync();

        var corte = DateTime.UtcNow.AddDays(-30);
        var idsParados = await _db.Produtos
            .Where(p => p.Ativo && p.QtdEstoque > 0)
            .Where(p => !_db.MovimentosEstoque.Any(m => m.ProdutoId == p.Id
                && m.Tipo == TipoMovimentoEstoque.SaidaVenda && m.DataHora >= corte))
            .Select(p => p.Id)
            .ToListAsync();

        var categorias = ativos
            .GroupBy(p => p.Categoria ?? "Sem categoria")
            .Select(g => new
            {
                categoria = g.Key,
                qtdProdutos = g.Count(),
                valorEstoque = g.Sum(p => p.Custo * p.QtdEstoque)
            })
            .OrderByDescending(c => c.valorEstoque)
            .ToList();

        return Ok(new
        {
            totalProdutos = ativos.Count,
            totalSkusZerados = ativos.Count(p => p.QtdEstoque == 0),
            totalSkusAbaixoMinimo = ativos.Count(p => p.QtdEstoque <= p.EstoqueMinimo),
            valorTotalEstoque = ativos.Sum(p => p.Custo * p.QtdEstoque),
            valorEstoqueParado = ativos.Where(p => idsParados.Contains(p.Id)).Sum(p => p.Custo * p.QtdEstoque),
            categorias
        });
    }
}