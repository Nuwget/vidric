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
    public DbSet<Produto> Produtos => Set<Produto>();
    public DbSet<MovimentoEstoque> MovimentosEstoque => Set<MovimentoEstoque>();

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

        modelBuilder.Entity<Produto>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Nome).IsRequired().HasMaxLength(200);
            entity.Property(p => p.Modelo).HasMaxLength(200);
            entity.Property(p => p.Cor).HasMaxLength(100);
            entity.Property(p => p.Categoria).HasMaxLength(100);
            entity.Property(p => p.CodigoBarras).HasMaxLength(100);
            entity.Property(p => p.Observacoes).HasMaxLength(1000);
            entity.Property(p => p.PrecoVenda).HasPrecision(18, 2);
            entity.Property(p => p.Custo).HasPrecision(18, 2);

            entity.HasOne(p => p.Loja)
                .WithMany()
                .HasForeignKey(p => p.LojaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(p => p.LojaId);
            entity.HasIndex(p => new { p.LojaId, p.Ativo });
            entity.HasIndex(p => new { p.LojaId, p.CodigoBarras })
                .IsUnique()
                .HasFilter("CodigoBarras IS NOT NULL");
            entity.HasIndex(p => new { p.LojaId, p.QtdEstoque, p.EstoqueMinimo });

            entity.HasQueryFilter(p => _tenant.EhSuperAdmin || p.LojaId == _tenant.LojaIdAtual);
        });

        modelBuilder.Entity<MovimentoEstoque>(entity =>
        {
            entity.HasKey(m => m.Id);
            entity.Property(m => m.Tipo).HasConversion<string>().HasMaxLength(20);
            entity.Property(m => m.Motivo).HasMaxLength(500);

            entity.HasOne(m => m.Produto)
                .WithMany()
                .HasForeignKey(m => m.ProdutoId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(m => new { m.LojaId, m.ProdutoId, m.DataHora });

            entity.HasQueryFilter(m => _tenant.EhSuperAdmin || m.LojaId == _tenant.LojaIdAtual);
        });
    }

    public override int SaveChanges()
    {
        ValidarVinculoPapelLoja();
        ValidarEstoque();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ValidarVinculoPapelLoja();
        ValidarEstoque();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void ValidarEstoque()
    {
        foreach (var entry in ChangeTracker.Entries<Produto>()
                     .Where(e => e.State is EntityState.Added or EntityState.Modified))
        {
            var produto = entry.Entity;
            if (produto.QtdEstoque < 0)
                throw new InvalidOperationException($"QtdEstoque não pode ser negativo (produto {produto.Nome}).");
            if (produto.PrecoVenda < 0 || produto.Custo < 0)
                throw new InvalidOperationException($"PrecoVenda e Custo não podem ser negativos (produto {produto.Nome}).");
        }

        foreach (var entry in ChangeTracker.Entries<MovimentoEstoque>()
                     .Where(e => e.State is EntityState.Added or EntityState.Modified))
        {
            if (entry.Entity.Quantidade <= 0)
                throw new InvalidOperationException("MovimentoEstoque.Quantidade deve ser sempre positiva.");
        }
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