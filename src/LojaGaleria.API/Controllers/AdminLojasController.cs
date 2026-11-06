using System.ComponentModel.DataAnnotations;
using LojaGaleria.Domain.Entities;
using LojaGaleria.Domain.Enums;
using LojaGaleria.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LojaGaleria.API.Controllers;

public record LojaResumoDto(
    Guid Id,
    string Nome,
    string? Cnpj,
    bool Ativa,
    DateTime CriadaEm,
    int QtdUsuarios,
    int QtdUsuariosAtivos);

public record UsuarioDto(
    Guid Id,
    string Nome,
    string Email,
    string Papel,
    bool Ativo,
    DateTime CriadoEm);

public record SuspenderLojaRequest
{
    [MaxLength(500)] public string? Motivo { get; init; }
}

public record CriarUsuarioLojaRequest
{
    [Required, MaxLength(200)] public string Nome { get; init; } = string.Empty;
    [Required, EmailAddress, MaxLength(200)] public string Email { get; init; } = string.Empty;
    [Required, MinLength(6)] public string Senha { get; init; } = string.Empty;
    [Required] public string Papel { get; init; } = string.Empty;
}

[ApiController]
[Route("api/admin/lojas")]
[Authorize(Policy = "SuperAdmin")]
public class AdminLojasController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminLojasController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] int pagina = 1, [FromQuery] int tamanho = 20)
    {
        pagina = Math.Max(1, pagina);
        tamanho = Math.Clamp(tamanho, 1, 100);

        var lojas = await _db.Lojas
            .OrderBy(l => l.CriadaEm)
            .Skip((pagina - 1) * tamanho)
            .Take(tamanho)
            .Select(l => new LojaResumoDto(
                l.Id,
                l.Nome,
                l.Cnpj,
                l.Ativa,
                l.CriadaEm,
                _db.Usuarios.Count(u => u.LojaId == l.Id),
                _db.Usuarios.Count(u => u.LojaId == l.Id && u.Ativo)))
            .ToListAsync();

        return Ok(lojas);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Detalhar(Guid id)
    {
        var loja = await _db.Lojas.FindAsync(id);
        if (loja is null)
            return NotFound(new { erro = "Loja não encontrada." });

        var usuarios = await _db.Usuarios
            .Where(u => u.LojaId == id)
            .OrderBy(u => u.Nome)
            .Select(u => new UsuarioDto(u.Id, u.Nome, u.Email, u.Papel.ToString(), u.Ativo, u.CriadoEm))
            .ToListAsync();

        return Ok(new
        {
            loja.Id,
            loja.Nome,
            loja.Cnpj,
            loja.Ativa,
            loja.MotivoSuspensao,
            loja.SuspensaEm,
            loja.CriadaEm,
            usuarios
        });
    }

    [HttpPatch("{id:guid}/suspender")]
    public async Task<IActionResult> Suspender(Guid id, SuspenderLojaRequest? request)
    {
        var loja = await _db.Lojas.FindAsync(id);
        if (loja is null)
            return NotFound(new { erro = "Loja não encontrada." });

        loja.Ativa = false;
        loja.MotivoSuspensao = request?.Motivo;
        loja.SuspensaEm = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { loja.Id, loja.Ativa, loja.MotivoSuspensao, loja.SuspensaEm });
    }

    [HttpPatch("{id:guid}/reativar")]
    public async Task<IActionResult> Reativar(Guid id)
    {
        var loja = await _db.Lojas.FindAsync(id);
        if (loja is null)
            return NotFound(new { erro = "Loja não encontrada." });

        loja.Ativa = true;
        loja.MotivoSuspensao = null;
        loja.SuspensaEm = null;
        await _db.SaveChangesAsync();

        return Ok(new { loja.Id, loja.Ativa });
    }

    [HttpPost("{id:guid}/usuarios")]
    public async Task<IActionResult> CriarUsuario(Guid id, CriarUsuarioLojaRequest request)
    {
        var loja = await _db.Lojas.FindAsync(id);
        if (loja is null)
            return NotFound(new { erro = "Loja não encontrada." });

        if (!Enum.TryParse<PapelUsuario>(request.Papel, ignoreCase: true, out var papel) ||
            papel == PapelUsuario.SuperAdmin)
            return BadRequest(new { erro = "Papel inválido. Use AdminLoja ou Funcionario." });

        var email = request.Email.Trim().ToLowerInvariant();
        var emailEmUso = await _db.Usuarios.IgnoreQueryFilters().AnyAsync(u => u.Email == email);
        if (emailEmUso)
            return Conflict(new { erro = "Email já cadastrado." });

        var usuario = new Usuario
        {
            LojaId = id,
            Nome = request.Nome.Trim(),
            Email = email,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(request.Senha),
            Papel = papel
        };

        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync();

        var dto = new UsuarioDto(usuario.Id, usuario.Nome, usuario.Email, usuario.Papel.ToString(), usuario.Ativo, usuario.CriadoEm);
        return Created($"/api/admin/lojas/{id}/usuarios/{usuario.Id}", dto);
    }

    [HttpDelete("{id:guid}/usuarios/{usuarioId:guid}")]
    public async Task<IActionResult> DesativarUsuario(Guid id, Guid usuarioId)
    {
        if (User.FindFirst("sub")?.Value == usuarioId.ToString())
            return Conflict(new { erro = "Não é possível desativar a si mesmo." });

        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Id == usuarioId && u.LojaId == id);
        if (usuario is null)
            return NotFound(new { erro = "Usuário não encontrado nesta loja." });

        if (usuario.Papel == PapelUsuario.AdminLoja && usuario.Ativo)
        {
            var outrosAdminsAtivos = await _db.Usuarios
                .CountAsync(u => u.LojaId == id && u.Papel == PapelUsuario.AdminLoja && u.Ativo && u.Id != usuarioId);
            if (outrosAdminsAtivos == 0)
                return Conflict(new { erro = "Não é possível desativar o último admin ativo da loja." });
        }

        usuario.Ativo = false;
        await _db.SaveChangesAsync();

        return Ok(new { usuario.Id, usuario.Ativo });
    }
}