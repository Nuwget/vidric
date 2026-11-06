using LojaGaleria.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LojaGaleria.API.Controllers;

[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Policy = "SuperAdmin")]
public class AdminDashboardController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminDashboardController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Obter()
    {
        var agora = DateTime.UtcNow;
        var inicioMes = new DateTime(agora.Year, agora.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var usuarios = _db.Usuarios.IgnoreQueryFilters();

        return Ok(new
        {
            totalLojas = await _db.Lojas.CountAsync(),
            lojasAtivas = await _db.Lojas.CountAsync(l => l.Ativa),
            lojasSuspensas = await _db.Lojas.CountAsync(l => !l.Ativa),
            totalUsuarios = await usuarios.CountAsync(),
            totalUsuariosAtivos = await usuarios.CountAsync(u => u.Ativo),
            lojasCriadasNoMes = await _db.Lojas.CountAsync(l => l.CriadaEm >= inicioMes)
        });
    }
}