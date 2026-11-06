using LojaGaleria.Domain.Entities;

namespace LojaGaleria.API.Vendas;

public record VendaResumoDto(
    Guid Id,
    DateTime DataHora,
    decimal Total,
    string Status,
    decimal Saldo,
    string? CpfCliente,
    int QtdItens);

public record VendaDetalheDto(
    Guid Id,
    DateTime DataHora,
    decimal Total,
    string Status,
    decimal Saldo,
    string? CpfCliente,
    Guid UsuarioId,
    string? Observacoes,
    IReadOnlyList<ItemVendaDto> Itens,
    IReadOnlyList<PagamentoDto> Pagamentos);

public record ItemVendaDto(
    Guid Id,
    string Tipo,
    Guid? ProdutoId,
    string Descricao,
    int Quantidade,
    decimal PrecoUnitario,
    decimal Subtotal);

public record PagamentoDto(
    Guid Id,
    string Forma,
    decimal Valor,
    DateTime DataHora,
    Guid UsuarioId);

public record AReceberDto(
    Guid Id,
    DateTime DataHora,
    string? CpfCliente,
    decimal Total,
    decimal TotalPago,
    decimal Saldo,
    string Status);

public static class VendaMapper
{
    public static VendaResumoDto Resumo(Venda venda, int qtdItens, decimal totalPago) =>
        new(venda.Id, venda.DataHora, venda.Total, venda.Status.ToString(),
            venda.Total - totalPago, venda.CpfCliente, qtdItens);

    public static VendaDetalheDto Detalhe(Venda venda)
    {
        var totalPago = venda.Pagamentos.Sum(p => p.Valor);
        return new VendaDetalheDto(
            venda.Id, venda.DataHora, venda.Total, venda.Status.ToString(),
            venda.Total - totalPago, venda.CpfCliente, venda.UsuarioId, venda.Observacoes,
            venda.Itens.Select(i => new ItemVendaDto(
                i.Id, i.Tipo.ToString(), i.ProdutoId, i.Descricao,
                i.Quantidade, i.PrecoUnitario, i.Subtotal)).ToList(),
            venda.Pagamentos.Select(p => new PagamentoDto(
                p.Id, p.Forma.ToString(), p.Valor, p.DataHora, p.UsuarioId)).ToList());
    }

    public static AReceberDto AReceber(Venda venda, decimal totalPago) =>
        new(venda.Id, venda.DataHora, venda.CpfCliente, venda.Total,
            totalPago, venda.Total - totalPago, venda.Status.ToString());
}