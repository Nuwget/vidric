using LojaGaleria.Domain.Enums;

namespace LojaGaleria.Domain.Services;

public static class RegrasCaixa
{
    public static bool EhEntrada(TipoMovimentoCaixa tipo) =>
        tipo is TipoMovimentoCaixa.Abertura or TipoMovimentoCaixa.VendaDinheiro or TipoMovimentoCaixa.Suprimento;

    public static int Sinal(TipoMovimentoCaixa tipo) => EhEntrada(tipo) ? 1 : -1;
}