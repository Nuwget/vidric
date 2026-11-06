using System.ComponentModel.DataAnnotations;
using LojaGaleria.API.Auth;
using LojaGaleria.Domain.Entities;
using LojaGaleria.Domain.Enums;
using LojaGaleria.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LojaGaleria.API.Controllers;

public record RegistrarLojaRequest
{
    [Required, MaxLength(200)] public string NomeLoja { get; init; } = string.Empty;
    [MaxLength(18)] public string? Cnpj { get; init; }
    [Required, MaxLength(200)] public string NomeAdmin { get; init; } = string.Empty;
    [Required, EmailAddress, MaxLength(200)] public string EmailAdmin { get; init; } = string.Empty;
    [Required, MinLength(6)] public string SenhaAdmin { get; init; } = string.Empty;
}

public record LoginRequest
{
    [Required, EmailAddress] public string Email { get; init; } = string.Empty;
    [Required] public string Senha { get; init; } = string.Empty;
}

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtTokenService _jwt;

    public AuthController(AppDbContext db, JwtTokenService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    [HttpPost("registrar-loja")]
    public async Task<IActionResult> RegistrarLoja(RegistrarLojaRequest request)
    {
        var email = request.EmailAdmin.Trim().ToLowerInvariant();

        var emailEmUso = await _db.Usuarios.IgnoreQueryFilters()
            .AnyAsync(u => u.Email == email);
        if (emailEmUso)
            return Conflict(new { erro = "Email já cadastrado." });

        var loja = new Loja
        {
            Nome = request.NomeLoja.Trim(),
            Cnpj = request.Cnpj?.Trim()
        };

        var admin = new Usuario
        {
            LojaId = loja.Id,
            Nome = request.NomeAdmin.Trim(),
            Email = email,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(request.SenhaAdmin),
            Papel = PapelUsuario.AdminLoja
        };

        _db.Lojas.Add(loja);
        _db.Usuarios.Add(admin);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { erro = "Email já cadastrado." });
        }

        return Created($"/api/lojas/{loja.Id}", new { lojaId = loja.Id });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var usuario = await _db.Usuarios.IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == email);

        if (usuario is null || !usuario.Ativo || !BCrypt.Net.BCrypt.Verify(request.Senha, usuario.SenhaHash))
            return Unauthorized(new { erro = "Email ou senha inválidos." });

        if (usuario.LojaId is Guid lojaId)
        {
            var loja = await _db.Lojas.FindAsync(lojaId);
            if (loja is null || !loja.Ativa)
                return StatusCode(StatusCodes.Status403Forbidden, new { erro = "Loja suspensa. Contate o suporte." });
        }

        return Ok(new
        {
            token = _jwt.GerarToken(usuario),
            nome = usuario.Nome,
            papel = usuario.Papel.ToString(),
            lojaId = usuario.LojaId
        });
    }
}