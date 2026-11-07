namespace LojaGaleria.Infrastructure.Financeiro;

public class RegraFinanceiraException : Exception
{
    public RegraFinanceiraException(string message) : base(message) { }
}

public class ConflitoException : Exception
{
    public ConflitoException(string message) : base(message) { }
}

public class EntidadeNaoEncontradaException : Exception
{
    public EntidadeNaoEncontradaException(string message) : base(message) { }
}