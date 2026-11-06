using LojaGaleria.Domain.Entities;
using LojaGaleria.Domain.Enums;
using LojaGaleria.Domain.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace LojaGaleria.Infrastructure.Data;

public class AppDbContext : DbContext
{
    private readonly ITenantProvider _tenant;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantProvider tenant)
        : base(options)
    {
        _tenant = tenant;
    }

    public DbSet<Loja> Lojas => Set<Loja>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Loja>(entity =>
        {
            entity.HasKey(l => l.Id);
            entity.Property(l => l.Nome).IsRequired().HasMaxLength(200);
            entity.Property(l => l.Cnpj).HasMaxLength(18);
            entity.Property(l => l.MotivoSuspensao).HasMaxLength(500);
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Nome).IsRequired().HasMaxLength(200);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(200);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.SenhaHash).IsRequired();
            entity.Property(u => u.Papel).HasConversion<string>().HasMaxLength(20);

            entity.HasOne(u => u.Loja)
                .WithMany()
                .HasForeignKey(u => u.LojaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasQueryFilter(u => _tenant.EhSuperAdmin || u.LojaId == _tenant.LojaIdAtual);
        });
    }

    public override int SaveChanges()
    {
        ValidarVinculoPapelLoja();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ValidarVinculoPapelLoja();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void ValidarVinculoPapelLoja()
    {
        var invalidos = ChangeTracker.Entries<Usuario>()
            .Where(e => e.State is EntityState.Added or EntityState.Modified)
            .Select(e => e.Entity)
            .Where(u => u.Papel == PapelUsuario.SuperAdmin
                ? u.LojaId is not null
                : u.LojaId is null);

        foreach (var usuario in invalidos)
        {
            throw new InvalidOperationException(
                usuario.Papel == PapelUsuario.SuperAdmin
                    ? "SuperAdmin não pode estar vinculado a uma loja (LojaId deve ser nulo)."
                    : $"{usuario.Papel} deve estar vinculado a uma loja (LojaId obrigatório).");
        }
    }
}