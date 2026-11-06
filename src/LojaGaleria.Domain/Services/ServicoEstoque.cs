using LojaGaleria.Domain.Entities;
using LojaGaleria.Domain.Enums;

namespace LojaGaleria.Domain.Services;

public static class ServicoEstoque
{
    public static MovimentoEstoque RegistrarMovimento(
        Produto produto,
        TipoMovimentoEstoque tipo,
        int quantidade,
        Guid usuarioId,
        string? motivo = null)
    {
        if (quantidade <= 0)
            throw new InvalidOperationException("A quantidade do movimento deve ser positiva.");

        var delta = tipo is TipoMovimentoEstoque.AjusteNegativo or TipoMovimentoEstoque.Perda or TipoMovimentoEstoque.SaidaVenda
            ? -quantidade
            : quantidade;

        var novaQtd = produto.QtdEstoque + delta;
        if (novaQtd < 0)
            throw new InvalidOperationException(
                $"Estoque insuficiente para o produto {produto.Nome}. Disponível: {produto.QtdEstoque}, solicitado: {quantidade}.");

        produto.QtdEstoque = novaQtd;
        produto.AtualizadoEm = DateTime.UtcNow;

        return new MovimentoEstoque
        {
            LojaId = produto.LojaId,
            ProdutoId = produto.Id,
            Tipo = tipo,
            Quantidade = quantidade,
            Motivo = motivo,
            UsuarioId = usuarioId
        };
    }
}