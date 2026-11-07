using System.ComponentModel.DataAnnotations;
using LojaGaleria.Domain.Entities;
using LojaGaleria.Domain.Enums;
using LojaGaleria.Infrastructure.Data;
using LojaGaleria.Infrastructure.Financeiro;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LojaGaleria.API.Controllers;

public record CriarContaRequest
{
    [Required, MaxLength(300)] public string Descricao { get; init; } = string.Empty;
    [MaxLength(100)] public string? Categoria { get; init; }
    [Range(0.01, double.MaxValue)] public decimal Valor { get; init; }
    [Required] public DateTime Vencimento { get; init; }
    [MaxLength(1000)] public string? Observacoes { get; init; }
}

public record PagarContaRequest
{
    [Required] public string FormaPagamento { get; init; } = string.Empty;
}

public record ContaPagarDto(
    Guid Id, string Descricao, string? Categoria, decimal Valor, DateTime Vencimento,
    bool Pago, DateTime? DataPagamento, string? Observacoes, DateTime CriadoEm)
{
    public static ContaPagarDto From(ContaPagar c) =>
        new(c.Id, c.Descricao, c.Categoria, c.Valor, c.Vencimento, c.Pago, c.DataPagamento, c.Observacoes, c.CriadoEm);
}

[ApiController]
[Route("api/contas-pagar")]
[Authorize(Policy = "LojaUser")]
public class ContasPagarController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ServicoContasPagar _servico;

    public ContasPagarController(AppDbContext db, ServicoContasPagar servico)
    {
        _db = db;
        _servico = servico;
    }

    private Guid LojaId => Guid.Parse(User.FindFirst("loja_id")!.Value);
    private Guid UsuarioId => Guid.Parse(User.FindFirst("sub")!.Value);

    [HttpPost]
    public async Task<IActionResult> Criar(CriarContaRequest request)
    {
        try
        {
            var conta = await _servico.CriarAsync(
                LojaId, request.Descricao, request.Categoria, request.Valor, request.Vencimento, request.Observacoes);
            return Created($"/api/contas-pagar/{conta.Id}", ContaPagarDto.From(conta));
        }
        catch (RegraFinanceiraException ex) { return BadRequest(new { erro = ex.Message }); }
    }

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] bool? pago,
        [FromQuery] bool? vencidas,
        [FromQuery] string? categoria,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanho = 20)
    {
        pagina = Math.Max(1, pagina);
        tamanho = Math.Clamp(tamanho, 1, 100);

        var query = _db.ContasPagar.AsQueryable();

        if (pago is not null)
            query = query.Where(c => c.Pago == pago.Value);

        if (vencidas == true)
        {
            var hoje = DateTime.UtcNow.Date;
            query = query.Where(c => !c.Pago && c.Vencimento < hoje);
        }

        if (!string.IsNullOrWhiteSpace(categoria))
            query = query.Where(c => c.Categoria == categoria);

        var contas = await query
            .OrderBy(c => c.Pago)
            .OrderBy(c => c.Vencimento)
            .Skip((pagina - 1) * tamanho)
            .Take(tamanho)
            .ToListAsync();

        return Ok(contas.Select(ContaPagarDto.From));
    }

    [HttpPatch("{id:guid}/pagar")]
    public async Task<IActionResult> Pagar(Guid id, PagarContaRequest request)
    {
        if (!Enum.TryParse<FormaPagamento>(request.FormaPagamento, ignoreCase: true, out var forma))
            return BadRequest(new { erro = "Forma de pagamento inválida." });

        try
        {
            var conta = await _servico.PagarAsync(id, UsuarioId, forma);
            return Ok(ContaPagarDto.From(conta));
        }
        catch (RegraFinanceiraException ex) { return BadRequest(new { erro = ex.Message }); }
        catch (EntidadeNaoEncontradaException ex) { return NotFound(new { erro = ex.Message }); }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, CriarContaRequest request)
    {
        try
        {
            var conta = await _servico.AtualizarAsync(
                id, request.Descricao, request.Categoria, request.Valor, request.Vencimento, request.Observacoes);
            return Ok(ContaPagarDto.From(conta));
        }
        catch (RegraFinanceiraException ex) { return BadRequest(new { erro = ex.Message }); }
        catch (EntidadeNaoEncontradaException ex) { return NotFound(new { erro = ex.Message }); }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        try
        {
            await _servico.ExcluirAsync(id);
            return NoContent();
        }
        catch (ConflitoException ex) { return Conflict(new { erro = ex.Message }); }
        catch (EntidadeNaoEncontradaException ex) { return NotFound(new { erro = ex.Message }); }
    }
}