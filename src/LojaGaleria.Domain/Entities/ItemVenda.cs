using LojaGaleria.Domain.Enums;

namespace LojaGaleria.Domain.Entities;

public class ItemVenda
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LojaId { get; set; }
    public Guid VendaId { get; set; }
    public TipoItemVenda Tipo { get; set; }
    public Guid? ProdutoId { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public int Quantidade { get; set; }
    public decimal PrecoUnitario { get; set; }
    public decimal Subtotal { get; set; }
}