using LojaGaleria.Domain.Enums;

namespace LojaGaleria.Domain.Entities;

public class MovimentoEstoque
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LojaId { get; set; }
    public Guid ProdutoId { get; set; }
    public TipoMovimentoEstoque Tipo { get; set; }
    public int Quantidade { get; set; }
    public string? Motivo { get; set; }
    public DateTime DataHora { get; set; } = DateTime.UtcNow;
    public Guid UsuarioId { get; set; }
    public Guid? VendaId { get; set; }

    public Produto? Produto { get; set; }
}