using LojaGaleria.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LojaGaleria.API.Controllers;

[ApiController]
[Route("api/lojas")]
[Authorize(Policy = "LojaUser")]
public class LojasController : ControllerBase
{
    private readonly AppDbContext _db;

    public LojasController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("minha-loja")]
    public async Task<IActionResult> MinhaLoja()
    {
        if (!Guid.TryParse(User.FindFirst("loja_id")?.Value, out var lojaId))
            return Forbid();

        var loja = await _db.Lojas.FindAsync(lojaId);
        if (loja is null)
            return NotFound();

        return Ok(new { loja.Id, loja.Nome, loja.Cnpj, loja.Ativa, loja.CriadaEm });
    }
}