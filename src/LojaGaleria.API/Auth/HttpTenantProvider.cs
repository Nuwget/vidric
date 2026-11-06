using System.Security.Claims;
using LojaGaleria.Domain.Tenancy;

namespace LojaGaleria.API.Auth;

public class HttpTenantProvider : ITenantProvider
{
    private readonly IHttpContextAccessor _accessor;

    public HttpTenantProvider(IHttpContextAccessor accessor)
    {
        _accessor = accessor;
    }

    private ClaimsPrincipal? Usuario => _accessor.HttpContext?.User;

    public Guid? LojaIdAtual =>
        Guid.TryParse(Usuario?.FindFirst("loja_id")?.Value, out var id) ? id : null;

    public bool EhSuperAdmin => Usuario?.IsInRole("SuperAdmin") ?? false;
}