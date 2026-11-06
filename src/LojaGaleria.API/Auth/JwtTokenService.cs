using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LojaGaleria.Domain.Entities;
using Microsoft.IdentityModel.Tokens;

namespace LojaGaleria.API.Auth;

public class JwtTokenService
{
    private readonly IConfiguration _config;

    public JwtTokenService(IConfiguration config)
    {
        _config = config;
    }

    public string GerarToken(Usuario usuario)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, usuario.Email),
            new("role", usuario.Papel.ToString())
        };

        if (usuario.LojaId is Guid lojaId)
            claims.Add(new Claim("loja_id", lojaId.ToString()));

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}