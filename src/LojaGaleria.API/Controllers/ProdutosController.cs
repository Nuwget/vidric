using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text;
using LojaGaleria.Domain.Entities;
using LojaGaleria.Domain.Enums;
using LojaGaleria.Domain.Services;
using LojaGaleria.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LojaGaleria.API.Controllers;

public record CriarProdutoRequest
{
    [Required, MaxLength(200)] public string Nome { get; init; } = string.Empty;
    [Range(0, double.MaxValue)] public decimal PrecoVenda { get; init; }
    [MaxLength(200)] public string? Modelo { get; init; }
    [MaxLength(100)] public string? Cor { get; init; }
    [MaxLength(100)] public string? Categoria { get; init; }
    [MaxLength(100)] public string? CodigoBarras { get; init; }
    [Range(0, double.MaxValue)] public decimal Custo { get; init; }
    [Range(0, int.MaxValue)] public int QtdEstoque { get; init; }
    [Range(0, int.MaxValue)] public int EstoqueMinimo { get; init; }
    [MaxLength(1000)] public string? Observacoes { get; init; }
}

public record AtualizarProdutoRequest
{
    [Required, MaxLength(200)] public string Nome { get; init; } = string.Empty;
    [MaxLength(200)] public string? Modelo { get; init; }
    [MaxLength(100)] public string? Cor { get; init; }
    [MaxLength(100)] public string? Categoria { get; init; }
    [MaxLength(100)] public string? CodigoBarras { get; init; }
    [Range(0, double.MaxValue)] public decimal PrecoVenda { get; init; }
    [Range(0, double.MaxValue)] public decimal Custo { get; init; }
    [Range(0, int.MaxValue)] public int EstoqueMinimo { get; init; }
    [MaxLength(1000)] public string? Observacoes { get; init; }
    public bool Ativo { get; init; } = true;
}

public record RegistrarMovimentoRequest
{
    [Required] public string Tipo { get; init; } = string.Empty;
    [Range(1, int.MaxValue)] public int Quantidade { get; init; }
    [MaxLength(500)] public string? Motivo { get; init; }
}

public record ProdutoDto(
    Guid Id,
    string Nome,
    string? Modelo,
    string? Cor,
    string? Categoria,
    string? CodigoBarras,
    decimal PrecoVenda,
    decimal Custo,
    int QtdEstoque,
    int EstoqueMinimo,
    string? Observacoes,
    bool Ativo,
    bool AbaixoDoMinimo);

[ApiController]
[Route("api/produtos")]
[Authorize(Policy = "LojaUser")]
public class ProdutosController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProdutosController(AppDbContext db)
    {
        _db = db;
    }

    private Guid LojaId => Guid.Parse(User.FindFirst("loja_id")!.Value);
    private Guid UsuarioId => Guid.Parse(User.FindFirst("sub")!.Value);

    private static ProdutoDto ParaDto(Produto p) =>
        new(p.Id, p.Nome, p.Modelo, p.Cor, p.Categoria, p.CodigoBarras,
            p.PrecoVenda, p.Custo, p.QtdEstoque, p.EstoqueMinimo, p.Observacoes,
            p.Ativo, p.QtdEstoque <= p.EstoqueMinimo);

    [HttpPost]
    public async Task<IActionResult> Criar(CriarProdutoRequest request)
    {
        var codigoBarras = string.IsNullOrWhiteSpace(request.CodigoBarras) ? null : request.CodigoBarras.Trim();
        if (codigoBarras is not null &&
            await _db.Produtos.AnyAsync(p => p.CodigoBarras == codigoBarras))
            return Conflict(new { erro = "Código de barras já cadastrado nesta loja." });

        var produto = new Produto
        {
            LojaId = LojaId,
            Nome = request.Nome.Trim(),
            Modelo = request.Modelo?.Trim(),
            Cor = request.Cor?.Trim(),
            Categoria = request.Categoria?.Trim(),
            CodigoBarras = codigoBarras,
            PrecoVenda = request.PrecoVenda,
            Custo = request.Custo,
            EstoqueMinimo = request.EstoqueMinimo,
            Observacoes = request.Observacoes
        };

        _db.Produtos.Add(produto);

        if (request.QtdEstoque > 0)
        {
            var movimento = ServicoEstoque.RegistrarMovimento(
                produto, TipoMovimentoEstoque.EntradaCompra, request.QtdEstoque, UsuarioId, "Estoque inicial");
            _db.MovimentosEstoque.Add(movimento);
        }

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { erro = "Código de barras já cadastrado nesta loja." });
        }

        return Created($"/api/produtos/{produto.Id}", ParaDto(produto));
    }

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] string? busca,
        [FromQuery] string? categoria,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanho = 20,
        [FromQuery] bool somenteAtivos = true)
    {
        pagina = Math.Max(1, pagina);
        tamanho = Math.Clamp(tamanho, 1, 100);

        var query = _db.Produtos.AsQueryable();

        if (somenteAtivos)
            query = query.Where(p => p.Ativo);

        if (!string.IsNullOrWhiteSpace(busca))
        {
            var termo = $"%{busca.Trim()}%";
            query = query.Where(p =>
                EF.Functions.Like(p.Nome, termo) ||
                (p.Modelo != null && EF.Functions.Like(p.Modelo, termo)) ||
                (p.Cor != null && EF.Functions.Like(p.Cor, termo)) ||
                (p.CodigoBarras != null && EF.Functions.Like(p.CodigoBarras, termo)));
        }

        if (!string.IsNullOrWhiteSpace(categoria))
            query = query.Where(p => p.Categoria == categoria);

        var produtos = await query
            .OrderBy(p => p.Nome)
            .Skip((pagina - 1) * tamanho)
            .Take(tamanho)
            .ToListAsync();

        return Ok(produtos.Select(ParaDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Detalhar(Guid id)
    {
        var produto = await _db.Produtos.FirstOrDefaultAsync(p => p.Id == id);
        if (produto is null)
            return NotFound(new { erro = "Produto não encontrado." });

        var movimentos = await _db.MovimentosEstoque
            .Where(m => m.ProdutoId == id)
            .OrderByDescending(m => m.DataHora)
            .Take(20)
            .Select(m => new
            {
                m.Id,
                tipo = m.Tipo.ToString(),
                m.Quantidade,
                m.Motivo,
                m.DataHora,
                m.UsuarioId,
                m.VendaId
            })
            .ToListAsync();

        return Ok(new { produto = ParaDto(produto), movimentos });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, AtualizarProdutoRequest request)
    {
        var produto = await _db.Produtos.FirstOrDefaultAsync(p => p.Id == id);
        if (produto is null)
            return NotFound(new { erro = "Produto não encontrado." });

        var codigoBarras = string.IsNullOrWhiteSpace(request.CodigoBarras) ? null : request.CodigoBarras.Trim();
        if (codigoBarras is not null &&
            await _db.Produtos.AnyAsync(p => p.CodigoBarras == codigoBarras && p.Id != id))
            return Conflict(new { erro = "Código de barras já cadastrado nesta loja." });

        produto.Nome = request.Nome.Trim();
        produto.Modelo = request.Modelo?.Trim();
        produto.Cor = request.Cor?.Trim();
        produto.Categoria = request.Categoria?.Trim();
        produto.CodigoBarras = codigoBarras;
        produto.PrecoVenda = request.PrecoVenda;
        produto.Custo = request.Custo;
        produto.EstoqueMinimo = request.EstoqueMinimo;
        produto.Observacoes = request.Observacoes;
        produto.Ativo = request.Ativo;
        produto.AtualizadoEm = DateTime.UtcNow;

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { erro = "Código de barras já cadastrado nesta loja." });
        }

        return Ok(ParaDto(produto));
    }

    [HttpPost("{id:guid}/movimentos")]
    public async Task<IActionResult> RegistrarMovimento(Guid id, RegistrarMovimentoRequest request)
    {
        var produto = await _db.Produtos.FirstOrDefaultAsync(p => p.Id == id);
        if (produto is null)
            return NotFound(new { erro = "Produto não encontrado." });

        if (!Enum.TryParse<TipoMovimentoEstoque>(request.Tipo, ignoreCase: true, out var tipo))
            return BadRequest(new { erro = "Tipo de movimento inválido." });

        if (tipo == TipoMovimentoEstoque.SaidaVenda)
            return BadRequest(new { erro = "SaidaVenda é reservada para o PDV (Fase 3b)." });

        MovimentoEstoque movimento;
        try
        {
            movimento = ServicoEstoque.RegistrarMovimento(produto, tipo, request.Quantidade, UsuarioId, request.Motivo);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { erro = ex.Message });
        }

        _db.MovimentosEstoque.Add(movimento);
        await _db.SaveChangesAsync();

        return Created($"/api/produtos/{id}", new
        {
            movimento = new
            {
                movimento.Id,
                tipo = movimento.Tipo.ToString(),
                movimento.Quantidade,
                movimento.Motivo,
                movimento.DataHora,
                movimento.UsuarioId
            },
            produto = ParaDto(produto)
        });
    }

    [HttpPatch("{id:guid}/ativo")]
    public async Task<IActionResult> AlternarAtivo(Guid id)
    {
        var produto = await _db.Produtos.FirstOrDefaultAsync(p => p.Id == id);
        if (produto is null)
            return NotFound(new { erro = "Produto não encontrado." });

        produto.Ativo = !produto.Ativo;
        produto.AtualizadoEm = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ParaDto(produto));
    }

    [HttpGet("alertas/abaixo-minimo")]
    public async Task<IActionResult> AbaixoMinimo()
    {
        var produtos = await _db.Produtos
            .Where(p => p.Ativo && p.QtdEstoque <= p.EstoqueMinimo)
            .OrderBy(p => p.QtdEstoque - p.EstoqueMinimo)
            .ToListAsync();

        return Ok(produtos.Select(ParaDto));
    }

    [HttpGet("relatorios/parados")]
    public async Task<IActionResult> Parados([FromQuery] int dias = 30)
    {
        dias = Math.Max(1, dias);
        var corte = DateTime.UtcNow.AddDays(-dias);

        var produtos = await _db.Produtos
            .Where(p => p.Ativo && p.QtdEstoque > 0)
            .Where(p => !_db.MovimentosEstoque.Any(m => m.ProdutoId == p.Id
                && m.Tipo == TipoMovimentoEstoque.SaidaVenda && m.DataHora >= corte))
            .ToListAsync();

        // SQLite não traduz ORDER BY/SUM de decimal; ordenação e soma no cliente.
        var ordenados = produtos.OrderByDescending(p => p.QtdEstoque * p.Custo).ToList();

        var itens = ordenados.Select(p => new
        {
            produtoId = p.Id,
            p.Nome,
            p.Modelo,
            p.Cor,
            p.QtdEstoque,
            p.Custo,
            valorImobilizado = p.QtdEstoque * p.Custo
        });

        return Ok(new
        {
            dias,
            vendasIndisponiveis = false,
            valorTotalImobilizado = ordenados.Sum(p => p.QtdEstoque * p.Custo),
            itens
        });
    }

    [HttpGet("exportar.csv")]
    public async Task<IActionResult> ExportarCsv()
    {
        var produtos = await _db.Produtos.OrderBy(p => p.Nome).ToListAsync();

        static string Csv(string? valor)
        {
            valor ??= "";
            return valor.Contains(',') || valor.Contains('"') || valor.Contains('\n')
                ? $"\"{valor.Replace("\"", "\"\"")}\""
                : valor;
        }

        var sb = new StringBuilder();
        sb.AppendLine("nome,modelo,cor,categoria,codigoBarras,precoVenda,custo,qtdEstoque,estoqueMinimo");
        foreach (var p in produtos)
        {
            sb.AppendLine(string.Join(",",
                Csv(p.Nome), Csv(p.Modelo), Csv(p.Cor), Csv(p.Categoria), Csv(p.CodigoBarras),
                p.PrecoVenda.ToString(CultureInfo.InvariantCulture),
                p.Custo.ToString(CultureInfo.InvariantCulture),
                p.QtdEstoque.ToString(CultureInfo.InvariantCulture),
                p.EstoqueMinimo.ToString(CultureInfo.InvariantCulture)));
        }

        return File(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv", "estoque.csv");
    }
}