using LojaGaleria.Infrastructure.Financeiro;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LojaGaleria.API.Controllers;

[ApiController]
[Route("api/financeiro")]
[Authorize(Policy = "LojaUser")]
public class FinanceiroController : ControllerBase
{
    private readonly ServicoFinanceiro _servico;

    public FinanceiroController(ServicoFinanceiro servico) => _servico = servico;

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard([FromQuery] DateTime? dataInicio, [FromQuery] DateTime? dataFim)
    {
        var (inicio, fim) = ResolverPeriodo(dataInicio, dataFim);
        var dashboard = await _servico.DashboardAsync(inicio, fim);
        return Ok(dashboard);
    }

    [HttpGet("vendas-por-dia")]
    public async Task<IActionResult> VendasPorDia([FromQuery] DateTime? dataInicio, [FromQuery] DateTime? dataFim)
    {
        var (inicio, fim) = ResolverPeriodo(dataInicio, dataFim);
        var serie = await _servico.VendasPorDiaAsync(inicio, fim);
        return Ok(serie);
    }

    [HttpGet("fluxo-caixa")]
    public async Task<IActionResult> FluxoCaixa([FromQuery] DateTime? dataInicio, [FromQuery] DateTime? dataFim)
    {
        var (inicio, fim) = ResolverPeriodo(dataInicio, dataFim);
        var fluxo = await _servico.FluxoCaixaAsync(inicio, fim);
        return Ok(fluxo);
    }

    private static (DateTime Inicio, DateTime Fim) ResolverPeriodo(DateTime? dataInicio, DateTime? dataFim)
    {
        if (dataInicio is not null && dataFim is not null)
            return (dataInicio.Value.ToUniversalTime(), dataFim.Value.ToUniversalTime());

        var agora = DateTime.UtcNow;
        var inicio = new DateTime(agora.Year, agora.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var fim = inicio.AddMonths(1);
        return (dataInicio?.ToUniversalTime() ?? inicio, dataFim?.ToUniversalTime() ?? fim);
    }
}