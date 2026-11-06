using LojaGaleria.Domain.Enums;

namespace LojaGaleria.Domain.Entities;

public class Pagamento
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LojaId { get; set; }
    public Guid VendaId { get; set; }
    public FormaPagamento Forma { get; set; }
    public decimal Valor { get; set; }
    public DateTime DataHora { get; set; } = DateTime.UtcNow;
    public Guid UsuarioId { get; set; }
}