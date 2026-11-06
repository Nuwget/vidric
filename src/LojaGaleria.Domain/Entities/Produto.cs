namespace LojaGaleria.Domain.Entities;

public class Produto
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LojaId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Modelo { get; set; }
    public string? Cor { get; set; }
    public string? Categoria { get; set; }
    public string? CodigoBarras { get; set; }
    public decimal PrecoVenda { get; set; }
    public decimal Custo { get; set; }
    public int QtdEstoque { get; set; }
    public int EstoqueMinimo { get; set; }
    public string? Observacoes { get; set; }
    public bool Ativo { get; set; } = true;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;

    public Loja? Loja { get; set; }
}