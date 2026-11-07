using System.ComponentModel.DataAnnotations;
using LojaGaleria.Domain.Entities;
using LojaGaleria.Domain.Enums;
using LojaGaleria.Domain.Services;
using LojaGaleria.Infrastructure.Financeiro;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LojaGaleria.API.Controllers;

public record AbrirCaixaRequest
{
    [Range(0, double.MaxValue)] public decimal ValorAbertura { get; init; }
    [MaxLength(1000)] public string? Observacoes { get; init; }
}

public record MovimentoCaixaRequest
{
    [Range(0.01, double.MaxValue)] public decimal Valor { get; init; }
    [MaxLength(300)] public string? Descricao { get; init; }
}

public record FecharCaixaRequest
{
    public decimal ValorInformado { get; init; }
    [MaxLength(1000)] public string? Observacoes { get; init; }
}

public record CaixaMovimentoDto(
    Guid Id, string Tipo, decimal Valor, string? Descricao, DateTime DataHora, Guid? VendaId, Guid? ContaPagarId);

public record CaixaResumoDto(
    Guid Id, DateTime DataAbertura, decimal ValorAbertura, decimal Entradas, decimal Saidas,
    decimal SaldoCalculado, int QtdMovimentos, string Status)
{
    public static CaixaResumoDto From(ResumoCaixa r) =>
        new(r.Caixa.Id, r.Caixa.DataAbertura, r.Caixa.ValorAbertura, r.Entradas, r.Saidas,
            r.SaldoCalculado, r.QtdMovimentos, r.Caixa.Status.ToString());
}

public record CaixaDetalheDto(
    Guid Id, DateTime DataAbertura, decimal ValorAbertura, string Status,
    DateTime? DataFechamento, decimal? ValorFechamentoCalculado, decimal? ValorFechamentoInformado,
    decimal? Diferenca, string? Observacoes, IReadOnlyList<CaixaMovimentoDto> Movimentos)
{
    public static CaixaDetalheDto From(Caixa c) => new(
        c.Id, c.DataAbertura, c.ValorAbertura, c.Status.ToString(), c.DataFechamento,
        c.ValorFechamentoCalculado, c.ValorFechamentoInformado, c.Diferenca, c.Observacoes,
        c.Movimentos
            .OrderBy(m => m.DataHora)
            .Select(m => new CaixaMovimentoDto(m.Id, m.Tipo.ToString(), m.Valor * RegrasCaixa.Sinal(m.Tipo),
                m.Descricao, m.DataHora, m.VendaId, m.ContaPagarId))
            .ToList());
}

public record CaixaHistoricoDto(
    Guid Id, DateTime DataAbertura, DateTime? DataFechamento, decimal ValorAbertura,
    decimal? ValorFechamentoCalculado, decimal? ValorFechamentoInformado, decimal? Diferenca)
{
    public static CaixaHistoricoDto From(Caixa c) => new(
        c.Id, c.DataAbertura, c.DataFechamento, c.ValorAbertura,
        c.ValorFechamentoCalculado, c.ValorFechamentoInformado, c.Diferenca);
}

[ApiController]
[Route("api/caixa")]
[Authorize(Policy = "LojaUser")]
public class CaixaController : ControllerBase
{
    private readonly ServicoCaixa _servico;

    public CaixaController(ServicoCaixa servico) => _servico = servico;

    private Guid LojaId => Guid.Parse(User.FindFirst("loja_id")!.Value);
    private Guid UsuarioId => Guid.Parse(User.FindFirst("sub")!.Value);

    [HttpPost("abrir")]
    public async Task<IActionResult> Abrir(AbrirCaixaRequest request)
    {
        try
        {
            var caixa = await _servico.AbrirAsync(LojaId, UsuarioId, request.ValorAbertura, request.Observacoes);
            return Created($"/api/caixa/{caixa.Id}", CaixaDetalheDto.From(caixa));
        }
        catch (RegraFinanceiraException ex) { return BadRequest(new { erro = ex.Message }); }
        catch (ConflitoException ex) { return Conflict(new { erro = ex.Message }); }
    }

    [HttpGet("atual")]
    public async Task<IActionResult> Atual()
    {
        try
        {
            var resumo = await _servico.ObterAtualAsync(LojaId);
            return Ok(CaixaResumoDto.From(resumo));
        }
        catch (EntidadeNaoEncontradaException ex) { return NotFound(new { erro = ex.Message }); }
    }

    [HttpPost("{id:guid}/sangria")]
    public async Task<IActionResult> Sangria(Guid id, MovimentoCaixaRequest request)
    {
        try
        {
            var movimento = await _servico.SangriaAsync(id, UsuarioId, request.Valor, request.Descricao);
            return Created($"/api/caixa/{id}", new CaixaMovimentoDto(movimento.Id, movimento.Tipo.ToString(),
                movimento.Valor * RegrasCaixa.Sinal(movimento.Tipo), movimento.Descricao, movimento.DataHora,
                movimento.VendaId, movimento.ContaPagarId));
        }
        catch (RegraFinanceiraException ex) { return BadRequest(new { erro = ex.Message }); }
        catch (ConflitoException ex) { return Conflict(new { erro = ex.Message }); }
        catch (EntidadeNaoEncontradaException ex) { return NotFound(new { erro = ex.Message }); }
    }

    [HttpPost("{id:guid}/suprimento")]
    public async Task<IActionResult> Suprimento(Guid id, MovimentoCaixaRequest request)
    {
        try
        {
            var movimento = await _servico.SuprimentoAsync(id, UsuarioId, request.Valor, request.Descricao);
            return Created($"/api/caixa/{id}", new CaixaMovimentoDto(movimento.Id, movimento.Tipo.ToString(),
                movimento.Valor * RegrasCaixa.Sinal(movimento.Tipo), movimento.Descricao, movimento.DataHora,
                movimento.VendaId, movimento.ContaPagarId));
        }
        catch (RegraFinanceiraException ex) { return BadRequest(new { erro = ex.Message }); }
        catch (ConflitoException ex) { return Conflict(new { erro = ex.Message }); }
        catch (EntidadeNaoEncontradaException ex) { return NotFound(new { erro = ex.Message }); }
    }

    [HttpPost("{id:guid}/fechar")]
    public async Task<IActionResult> Fechar(Guid id, FecharCaixaRequest request)
    {
        try
        {
            var caixa = await _servico.FecharAsync(id, UsuarioId, request.ValorInformado, request.Observacoes);
            return Ok(CaixaDetalheDto.From(caixa));
        }
        catch (ConflitoException ex) { return Conflict(new { erro = ex.Message }); }
        catch (EntidadeNaoEncontradaException ex) { return NotFound(new { erro = ex.Message }); }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Detalhar(Guid id)
    {
        try
        {
            var caixa = await _servico.ObterDetalheAsync(id);
            return Ok(CaixaDetalheDto.From(caixa));
        }
        catch (EntidadeNaoEncontradaException ex) { return NotFound(new { erro = ex.Message }); }
    }

    [HttpGet]
    public async Task<IActionResult> Historico([FromQuery] DateTime? dataInicio, [FromQuery] DateTime? dataFim)
    {
        var agora = DateTime.UtcNow;
        var inicio = (dataInicio ?? new DateTime(agora.Year, agora.Month, 1, 0, 0, 0, DateTimeKind.Utc)).ToUniversalTime();
        var fim = (dataFim ?? inicio.AddMonths(1)).ToUniversalTime();

        var resumos = await _servico.HistoricoAsync(inicio, fim);
        return Ok(resumos.Select(r => CaixaHistoricoDto.From(r.Caixa)));
    }
}