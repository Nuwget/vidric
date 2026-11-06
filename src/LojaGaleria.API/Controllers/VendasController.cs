using System.ComponentModel.DataAnnotations;
using LojaGaleria.API.Vendas;
using LojaGaleria.Domain.Enums;
using LojaGaleria.Infrastructure.Vendas;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LojaGaleria.Infrastructure.Data;

namespace LojaGaleria.API.Controllers;

public record ItemVendaRequest
{
    [Required] public string Tipo { get; init; } = string.Empty;
    public Guid? ProdutoId { get; init; }
    [MaxLength(300)] public string? Descricao { get; init; }
    [Range(1, int.MaxValue)] public int Quantidade { get; init; }
    [Range(0, double.MaxValue)] public decimal? PrecoUnitario { get; init; }
}

public record PagamentoRequest
{
    [Required] public string Forma { get; init; } = string.Empty;
    [Range(0.01, double.MaxValue)] public decimal Valor { get; init; }
}

public record CriarVendaRequest
{
    [MaxLength(11)] public string? CpfCliente { get; init; }
    [MaxLength(1000)] public string? Observacoes { get; init; }
    [Required, MinLength(1)] public List<ItemVendaRequest> Itens { get; init; } = new();
    public List<PagamentoRequest> Pagamentos { get; init; } = new();
}

[ApiController]
[Route("api/vendas")]
[Authorize(Policy = "LojaUser")]
public class VendasController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ServicoVendas _servico;

    public VendasController(AppDbContext db, ServicoVendas servico)
    {
        _db = db;
        _servico = servico;
    }

    private Guid LojaId => Guid.Parse(User.FindFirst("loja_id")!.Value);
    private Guid UsuarioId => Guid.Parse(User.FindFirst("sub")!.Value);

    [HttpPost]
    public async Task<IActionResult> Criar(CriarVendaRequest request)
    {
        if (!TryConverterItens(request.Itens, out var itens, out var erro))
            return BadRequest(new { erro });

        if (!TryConverterPagamentos(request.Pagamentos, out var pagamentos, out erro))
            return BadRequest(new { erro });

        try
        {
            var venda = await _servico.CriarVendaAsync(
                LojaId, UsuarioId, request.CpfCliente, request.Observacoes, itens, pagamentos);
            return Created($"/api/vendas/{venda.Id}", VendaMapper.Detalhe(venda));
        }
        catch (RegraVendaException ex)
        {
            return BadRequest(new { erro = ex.Message });
        }
        catch (EstoqueInsuficienteException ex)
        {
            return Conflict(new { erro = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] string? status,
        [FromQuery] string? cpfCliente,
        [FromQuery] DateTime? dataInicio,
        [FromQuery] DateTime? dataFim,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanho = 20)
    {
        pagina = Math.Max(1, pagina);
        tamanho = Math.Clamp(tamanho, 1, 100);

        var query = _db.Vendas.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            var statuses = new List<StatusVenda>();
            foreach (var parte in status.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (!Enum.TryParse<StatusVenda>(parte, ignoreCase: true, out var parsed))
                    return BadRequest(new { erro = $"Status inválido: {parte}." });
                statuses.Add(parsed);
            }
            query = query.Where(v => statuses.Contains(v.Status));
        }

        if (!string.IsNullOrWhiteSpace(cpfCliente))
            query = query.Where(v => v.CpfCliente == cpfCliente);

        if (dataInicio is not null)
            query = query.Where(v => v.DataHora >= dataInicio.Value.ToUniversalTime());

        if (dataFim is not null)
            query = query.Where(v => v.DataHora <= dataFim.Value.ToUniversalTime());

        // SQLite não traduz Sum/OrderBy em decimal; materializa a página e calcula no cliente.
        // No PostgreSQL (backlog de migração) isto volta a rodar no servidor.
        var vendas = await query
            .OrderByDescending(v => v.DataHora)
            .Skip((pagina - 1) * tamanho)
            .Take(tamanho)
            .Include(v => v.Itens)
            .Include(v => v.Pagamentos)
            .ToListAsync();

        return Ok(vendas.Select(v => VendaMapper.Resumo(v, v.Itens.Count, v.Pagamentos.Sum(p => p.Valor))));
    }

    [HttpGet("a-receber")]
    public async Task<IActionResult> AReceber()
    {
        // Sum em decimal não é traduzido pelo SQLite; calcula no cliente após materializar.
        var vendas = await _db.Vendas
            .Where(v => v.Status == StatusVenda.Parcial || v.Status == StatusVenda.Pendente)
            .OrderBy(v => v.DataHora)
            .Include(v => v.Pagamentos)
            .ToListAsync();

        return Ok(vendas.Select(v => VendaMapper.AReceber(v, v.Pagamentos.Sum(p => p.Valor))));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Detalhar(Guid id)
    {
        var venda = await _db.Vendas
            .Include(v => v.Itens)
            .Include(v => v.Pagamentos)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (venda is null)
            return NotFound(new { erro = "Venda não encontrada." });

        return Ok(VendaMapper.Detalhe(venda));
    }

    [HttpPost("{id:guid}/pagamentos")]
    public async Task<IActionResult> AdicionarPagamento(Guid id, PagamentoRequest request)
    {
        if (!Enum.TryParse<FormaPagamento>(request.Forma, ignoreCase: true, out var forma))
            return BadRequest(new { erro = "Forma de pagamento inválida." });

        try
        {
            var (pagamento, venda) = await _servico.AdicionarPagamentoAsync(id, UsuarioId, forma, request.Valor);
            var totalPago = venda.Pagamentos.Sum(p => p.Valor);
            return Created($"/api/vendas/{id}", new
            {
                pagamento = new PagamentoDto(pagamento.Id, pagamento.Forma.ToString(), pagamento.Valor, pagamento.DataHora, pagamento.UsuarioId),
                venda = VendaMapper.Resumo(venda, venda.Itens.Count, totalPago)
            });
        }
        catch (RegraVendaException ex)
        {
            return BadRequest(new { erro = ex.Message });
        }
    }

    private static bool TryConverterItens(List<ItemVendaRequest> requests, out List<ItemVendaInput> itens, out string erro)
    {
        itens = new List<ItemVendaInput>();
        foreach (var item in requests)
        {
            if (!Enum.TryParse<TipoItemVenda>(item.Tipo, ignoreCase: true, out var tipo))
            {
                erro = $"Tipo de item inválido: {item.Tipo}.";
                return false;
            }
            itens.Add(new ItemVendaInput(tipo, item.ProdutoId, item.Descricao, item.Quantidade, item.PrecoUnitario));
        }
        erro = "";
        return true;
    }

    private static bool TryConverterPagamentos(List<PagamentoRequest> requests, out List<PagamentoInput> pagamentos, out string erro)
    {
        pagamentos = new List<PagamentoInput>();
        foreach (var pagamento in requests)
        {
            if (!Enum.TryParse<FormaPagamento>(pagamento.Forma, ignoreCase: true, out var forma))
            {
                erro = $"Forma de pagamento inválida: {pagamento.Forma}.";
                return false;
            }
            pagamentos.Add(new PagamentoInput(forma, pagamento.Valor));
        }
        erro = "";
        return true;
    }
}