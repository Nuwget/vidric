using LojaGaleria.Domain.Enums;

namespace LojaGaleria.Domain.Entities;

public class MovimentoCaixa
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LojaId { get; set; }
    public Guid CaixaId { get; set; }
    public TipoMovimentoCaixa Tipo { get; set; }
    public decimal Valor { get; set; }
    public string? Descricao { get; set; }
    public DateTime DataHora { get; set; } = DateTime.UtcNow;
    public Guid UsuarioId { get; set; }
    public Guid? VendaId { get; set; }
    public Guid? ContaPagarId { get; set; }

    public Caixa? Caixa { get; set; }
}