using LojaGaleria.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LojaGaleria.API.Controllers;

// Endpoint temporário da Fase 1 para validar o HasQueryFilter. Remover na Fase 2.
[ApiController]
[Route("api/debug")]
[Authorize]
public class DebugController : ControllerBase
{
    private readonly AppDbContext _db;

    public DebugController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("contar-usuarios")]
    public IActionResult ContarUsuarios()
    {
        return Ok(new { total = _db.Usuarios.Count() });
    }
}