'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowDownToLine, ArrowUpFromLine, Pencil, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { BadgeAbaixoMinimo, BadgeInativo } from '@/components/estoque/badges';
import { ModalEditarProduto } from '@/components/estoque/modal-editar-produto';
import { ModalMovimento, type AcaoEstoque } from '@/components/estoque/modal-movimento';
import { apiErrorMessage } from '@/lib/api';
import { decodeJwt, readSession } from '@/lib/auth';
import { formatBRL } from '@/lib/format';
import { useAlternarAtivo, useProdutoDetalhe } from '@/hooks/useEstoque';
import type { MovimentoEstoque, TipoMovimentoEstoque } from '@/types/api';

const ROTULO_TIPO: Record<TipoMovimentoEstoque, string> = {
  EntradaCompra: 'Entrada',
  SaidaVenda: 'Venda',
  AjustePositivo: 'Ajuste +',
  AjusteNegativo: 'Ajuste −',
  Perda: 'Perda',
  Devolucao: 'Devolução',
};

const TIPOS_SAIDA: TipoMovimentoEstoque[] = ['SaidaVenda', 'AjusteNegativo', 'Perda'];

function formatarData(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function ProdutoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useProdutoDetalhe(id);
  const [acao, setAcao] = useState<AcaoEstoque | null>(null);
  const [editando, setEditando] = useState(false);
  const alternar = useAlternarAtivo();

  if (isLoading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Carregando produto…</p>;
  }
  if (isError || !data) {
    return (
      <div className="glass p-6 text-center">
        <p className="text-sm text-muted-foreground">Produto não encontrado.</p>
        <Link href="/estoque" className="text-sm font-semibold no-underline hover:underline" style={{ color: 'var(--accent-text)' }}>
          ← Voltar ao estoque
        </Link>
      </div>
    );
  }

  const { produto, movimentos } = data;
  const usuarioAtual = decodeJwt(readSession()?.token ?? '')?.sub;

  async function aoAlternar() {
    try {
      const atualizado = await alternar.mutateAsync(produto.id);
      toast.success(atualizado.ativo ? 'Produto reativado.' : 'Produto desativado.');
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? 'Erro ao alterar o produto.');
    }
  }

  const acoes: { acao: AcaoEstoque; rotulo: string; icone: typeof ArrowDownToLine }[] = [
    { acao: 'entrada', rotulo: 'Entrada', icone: ArrowDownToLine },
    { acao: 'ajuste', rotulo: 'Ajuste', icone: SlidersHorizontal },
    { acao: 'perda', rotulo: 'Perda', icone: ArrowUpFromLine },
    { acao: 'devolucao', rotulo: 'Devolução', icone: RotateCcw },
  ];

  function linhaUsuario(m: MovimentoEstoque): string {
    return m.usuarioId === usuarioAtual ? 'Você' : m.usuarioId.slice(0, 8);
  }

  return (
    <div className="flex flex-col gap-3.5 pb-4">
      <div className="glass p-5 md:p-6">
        <Link href="/estoque" className="text-sm text-muted-foreground no-underline hover:underline">
          ← Estoque
        </Link>
        <div className="mt-3 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-[-0.022em] leading-tight">
              {produto.nome}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {[produto.modelo, produto.cor, produto.categoria].filter(Boolean).join(' · ') || 'Sem detalhes cadastrais'}
            </p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <BadgeAbaixoMinimo produto={produto} />
              {!produto.ativo && <BadgeInativo />}
            </div>
            <p className="mt-3 flex items-baseline gap-2">
              <span data-testid="estoque-atual" className="text-[32px] font-bold money tracking-[-0.03em]">
                {produto.qtdEstoque}
              </span>
              <span className="text-sm text-muted-foreground">
                em estoque · mínimo {produto.estoqueMinimo} · {formatBRL(produto.precoVenda)}
              </span>
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              data-testid="botao-editar"
              onClick={() => setEditando(true)}
              className="h-12 px-4 flex items-center gap-2 rounded-[calc(var(--radius)*0.6)] text-sm font-medium transition-transform active:scale-[0.97]"
              style={{ border: '1px solid var(--glass-border)', color: 'var(--fg)' }}
            >
              <Pencil className="size-4" />
              Editar
            </button>
            <button
              type="button"
              data-testid="botao-desativar"
              onClick={aoAlternar}
              disabled={alternar.isPending}
              className="h-12 px-4 rounded-[calc(var(--radius)*0.6)] text-sm font-semibold transition-transform active:scale-[0.97]"
              style={
                produto.ativo
                  ? { background: 'var(--danger-soft)', color: 'var(--danger-text)' }
                  : { background: 'var(--accent-soft)', color: 'var(--accent-text)' }
              }
            >
              {produto.ativo ? 'Desativar' : 'Reativar'}
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
          {acoes.map(({ acao: a, rotulo, icone: Icone }) => (
            <button
              key={a}
              type="button"
              data-testid={`botao-${a}`}
              onClick={() => setAcao(a)}
              className="h-12 flex items-center justify-center gap-2 rounded-[calc(var(--radius)*0.6)] text-sm font-semibold transition-transform active:scale-[0.97]"
              style={
                a === 'perda'
                  ? { background: 'var(--danger-soft)', color: 'var(--danger-text)' }
                  : { background: 'var(--accent)', color: 'var(--on-accent)' }
              }
            >
              <Icone className="size-4" />
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="glass p-5 md:p-6">
        <h2 className="text-lg font-semibold tracking-[-0.022em]">Últimos movimentos</h2>
        {movimentos.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nenhum movimento registrado.</p>
        ) : (
          <>
            <table className="hidden md:table w-full text-sm mt-3" data-testid="tabela-movimentos">
              <thead>
                <tr className="text-left text-xs text-muted-foreground" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th className="py-2.5 pr-3 font-medium">Data</th>
                  <th className="py-2.5 pr-3 font-medium">Tipo</th>
                  <th className="py-2.5 pr-3 font-medium">Qtd</th>
                  <th className="py-2.5 pr-3 font-medium">Motivo</th>
                  <th className="py-2.5 font-medium">Usuário</th>
                </tr>
              </thead>
              <tbody>
                {movimentos.map((m) => (
                  <tr key={m.id} data-testid="movimento-row" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td className="py-2.5 pr-3 money text-muted-foreground">{formatarData(m.dataHora)}</td>
                    <td className="py-2.5 pr-3 font-medium">{ROTULO_TIPO[m.tipo]}</td>
                    <td className="py-2.5 pr-3 money font-semibold" style={{ color: TIPOS_SAIDA.includes(m.tipo) ? 'var(--danger-text)' : 'var(--accent-text)' }}>
                      {TIPOS_SAIDA.includes(m.tipo) ? '−' : '+'}{m.quantidade}
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{m.motivo ?? '—'}</td>
                    <td className="py-2.5 text-muted-foreground">{linhaUsuario(m)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="md:hidden flex flex-col gap-2 mt-3" data-testid="cards-movimentos">
              {movimentos.map((m) => (
                <div key={m.id} data-testid="movimento-row" className="glass-card p-3.5 text-sm">
                  <p className="flex items-center justify-between">
                    <span className="font-semibold">{ROTULO_TIPO[m.tipo]}</span>
                    <span className="money font-bold" style={{ color: TIPOS_SAIDA.includes(m.tipo) ? 'var(--danger-text)' : 'var(--accent-text)' }}>
                      {TIPOS_SAIDA.includes(m.tipo) ? '−' : '+'}{m.quantidade}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatarData(m.dataHora)} · {linhaUsuario(m)}
                  </p>
                  {m.motivo && <p className="text-xs text-muted-foreground mt-0.5">{m.motivo}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ModalMovimento produto={produto} acao={acao} onFechar={() => setAcao(null)} />
      {editando && (
        <ModalEditarProduto produto={produto} aberto={editando} onFechar={() => setEditando(false)} />
      )}
    </div>
  );
}