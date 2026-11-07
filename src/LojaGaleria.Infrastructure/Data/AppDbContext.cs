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
    public DbSet<Venda> Vendas => Set<Venda>();
    public DbSet<ItemVenda> ItemVendas => Set<ItemVenda>();
    public DbSet<Pagamento> Pagamentos => Set<Pagamento>();
    public DbSet<ContaPagar> ContasPagar => Set<ContaPagar>();
    public DbSet<Caixa> Caixas => Set<Caixa>();
    public DbSet<MovimentoCaixa> MovimentosCaixa => Set<MovimentoCaixa>();

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

        modelBuilder.Entity<Venda>(entity =>
        {
            entity.HasKey(v => v.Id);
            entity.Property(v => v.CpfCliente).HasMaxLength(11);
            entity.Property(v => v.Total).HasPrecision(18, 2);
            entity.Property(v => v.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(v => v.Observacoes).HasMaxLength(1000);

            entity.HasIndex(v => v.LojaId);
            entity.HasIndex(v => new { v.LojaId, v.DataHora });
            entity.HasIndex(v => new { v.LojaId, v.Status });
            entity.HasIndex(v => new { v.LojaId, v.CpfCliente })
                .HasFilter("CpfCliente IS NOT NULL");

            entity.HasQueryFilter(v => _tenant.EhSuperAdmin || v.LojaId == _tenant.LojaIdAtual);
        });

        modelBuilder.Entity<ItemVenda>(entity =>
        {
            entity.HasKey(i => i.Id);
            entity.Property(i => i.Tipo).HasConversion<string>().HasMaxLength(20);
            entity.Property(i => i.Descricao).IsRequired().HasMaxLength(300);
            entity.Property(i => i.PrecoUnitario).HasPrecision(18, 2);
            entity.Property(i => i.Subtotal).HasPrecision(18, 2);

            entity.HasOne<Venda>()
                .WithMany(v => v.Itens)
                .HasForeignKey(i => i.VendaId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(i => i.VendaId);

            entity.HasQueryFilter(i => _tenant.EhSuperAdmin || i.LojaId == _tenant.LojaIdAtual);
        });

        modelBuilder.Entity<Pagamento>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Forma).HasConversion<string>().HasMaxLength(20);
            entity.Property(p => p.Valor).HasPrecision(18, 2);

            entity.HasOne<Venda>()
                .WithMany(v => v.Pagamentos)
                .HasForeignKey(p => p.VendaId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(p => p.VendaId);

            entity.HasQueryFilter(p => _tenant.EhSuperAdmin || p.LojaId == _tenant.LojaIdAtual);
        });

        modelBuilder.Entity<ContaPagar>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Descricao).IsRequired().HasMaxLength(300);
            entity.Property(c => c.Categoria).HasMaxLength(100);
            entity.Property(c => c.Valor).HasPrecision(18, 2);
            entity.Property(c => c.Observacoes).HasMaxLength(1000);

            entity.HasIndex(c => c.LojaId);
            entity.HasIndex(c => new { c.LojaId, c.Pago, c.Vencimento });

            entity.HasQueryFilter(c => _tenant.EhSuperAdmin || c.LojaId == _tenant.LojaIdAtual);
        });

        modelBuilder.Entity<Caixa>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.ValorAbertura).HasPrecision(18, 2);
            entity.Property(c => c.ValorFechamentoInformado).HasPrecision(18, 2);
            entity.Property(c => c.ValorFechamentoCalculado).HasPrecision(18, 2);
            entity.Property(c => c.Diferenca).HasPrecision(18, 2);
            entity.Property(c => c.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(c => c.Observacoes).HasMaxLength(1000);

            entity.HasIndex(c => new { c.LojaId, c.DataAbertura });
            entity.HasIndex(c => new { c.LojaId, c.Status });

            entity.HasQueryFilter(c => _tenant.EhSuperAdmin || c.LojaId == _tenant.LojaIdAtual);
        });

        modelBuilder.Entity<MovimentoCaixa>(entity =>
        {
            entity.HasKey(m => m.Id);
            entity.Property(m => m.Tipo).HasConversion<string>().HasMaxLength(20);
            entity.Property(m => m.Valor).HasPrecision(18, 2);
            entity.Property(m => m.Descricao).HasMaxLength(300);

            entity.HasOne(m => m.Caixa)
                .WithMany(c => c.Movimentos)
                .HasForeignKey(m => m.CaixaId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(m => new { m.CaixaId, m.DataHora });

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