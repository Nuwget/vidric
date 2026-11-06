using LojaGaleria.Domain.Enums;

namespace LojaGaleria.Domain.Entities;

public class Venda
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LojaId { get; set; }
    public DateTime DataHora { get; set; } = DateTime.UtcNow;
    public string? CpfCliente { get; set; }
    public decimal Total { get; set; }
    public StatusVenda Status { get; set; } = StatusVenda.Pendente;
    public Guid UsuarioId { get; set; }
    public string? Observacoes { get; set; }

    public ICollection<ItemVenda> Itens { get; set; } = new List<ItemVenda>();
    public ICollection<Pagamento> Pagamentos { get; set; } = new List<Pagamento>();
}