namespace LojaGaleria.Domain.Tenancy;

public interface ITenantProvider
{
    Guid? LojaIdAtual { get; }
    bool EhSuperAdmin { get; }
}