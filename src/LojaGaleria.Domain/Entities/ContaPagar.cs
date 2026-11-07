namespace LojaGaleria.Domain.Entities;

public class ContaPagar
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LojaId { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public string? Categoria { get; set; }
    public decimal Valor { get; set; }
    public DateTime Vencimento { get; set; }
    public bool Pago { get; set; }
    public DateTime? DataPagamento { get; set; }
    public string? Observacoes { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}