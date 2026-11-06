using LojaGaleria.Infrastructure.Data;

namespace LojaGaleria.API.Middleware;

public class LojaAtivaMiddleware
{
    private readonly RequestDelegate _next;

    public LojaAtivaMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        if (context.User.Identity?.IsAuthenticated == true &&
            Guid.TryParse(context.User.FindFirst("loja_id")?.Value, out var lojaId))
        {
            var loja = await db.Lojas.FindAsync(lojaId);
            if (loja is null || !loja.Ativa)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new { erro = "Loja suspensa. Contate o suporte." });
                return;
            }
        }

        await _next(context);
    }
}