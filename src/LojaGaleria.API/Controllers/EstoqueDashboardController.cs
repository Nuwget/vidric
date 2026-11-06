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
            // Fase 3b: substituir pelo filtro de produtos sem SaidaVenda nos últimos 30 dias
            // (mesma regra de /api/produtos/relatorios/parados).
            valorEstoqueParado = ativos.Where(p => p.QtdEstoque > 0).Sum(p => p.Custo * p.QtdEstoque),
            categorias
        });
    }
}