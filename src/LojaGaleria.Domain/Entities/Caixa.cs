using LojaGaleria.Domain.Enums;

namespace LojaGaleria.Domain.Entities;

public class Caixa
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LojaId { get; set; }
    public DateTime DataAbertura { get; set; } = DateTime.UtcNow;
    public Guid UsuarioAberturaId { get; set; }
    public decimal ValorAbertura { get; set; }
    public DateTime? DataFechamento { get; set; }
    public Guid? UsuarioFechamentoId { get; set; }
    public decimal? ValorFechamentoInformado { get; set; }
    public decimal? ValorFechamentoCalculado { get; set; }
    public decimal? Diferenca { get; set; }
    public string? Observacoes { get; set; }
    public StatusCaixa Status { get; set; } = StatusCaixa.Aberto;

    public ICollection<MovimentoCaixa> Movimentos { get; set; } = new List<MovimentoCaixa>();
}