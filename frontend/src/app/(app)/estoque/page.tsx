'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BadgeAbaixoMinimo, BadgeInativo } from '@/components/estoque/badges';
import { MenuAcoesProduto } from '@/components/estoque/menu-acoes-produto';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useProdutos } from '@/hooks/useProdutos';
import {
  baixarCsvEstoque,
  useAlertasAbaixoMinimo,
  useEstoqueDashboard,
} from '@/hooks/useEstoque';
import { apiErrorMessage } from '@/lib/api';
import { formatBRL } from '@/lib/format';
import type { Produto } from '@/types/api';

const TAMANHO_PAGINA = 20;

export default function EstoquePage() {
  const router = useRouter();
  const [buscaInput, setBuscaInput] = useState('');
  const busca = useDebouncedValue(buscaInput, 300);
  const [categoria, setCategoria] = useState('todas');
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [soAbaixoMinimo, setSoAbaixoMinimo] = useState(false);
  const [exportando, setExportando] = useState(false);

  const { data: dashboard } = useEstoqueDashboard();
  const lista = useProdutos(
    {
      busca,
      categoria: categoria === 'todas' ? undefined : categoria,
      pagina,
      tamanho: TAMANHO_PAGINA,
      somenteAtivos: !mostrarInativos,
    },
    !soAbaixoMinimo,
  );
  const alertas = useAlertasAbaixoMinimo(soAbaixoMinimo);

  const produtos: Produto[] = soAbaixoMinimo ? alertas.data ?? [] : lista.data ?? [];
  const carregando = soAbaixoMinimo ? alertas.isLoading : lista.isLoading;
  const temProxima = !soAbaixoMinimo && (lista.data?.length ?? 0) === TAMANHO_PAGINA;

  function mudarFiltro(fn: () => void) {
    fn();
    setPagina(1);
  }

  async function exportar() {
    setExportando(true);
    try {
      await baixarCsvEstoque();
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? 'Erro ao exportar CSV.');
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3.5 pb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="glass p-5" data-testid="kpi-valor-estoque">
          <p className="text-sm text-muted-foreground">Valor em estoque</p>
          <p className="mt-1 text-[26px] font-bold money tracking-[-0.022em]">
            {dashboard ? formatBRL(dashboard.valorTotalEstoque) : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">custo × quantidade</p>
        </div>
        <button
          type="button"
          data-testid="kpi-abaixo-minimo"
          aria-pressed={soAbaixoMinimo}
          onClick={() => mudarFiltro(() => setSoAbaixoMinimo((v) => !v))}
          className="glass p-5 text-left transition-transform active:scale-[0.99]"
          style={soAbaixoMinimo ? { boxShadow: 'var(--shadow-hover)', outline: '2px solid var(--danger)' } : undefined}
        >
          <p className="text-sm text-muted-foreground">Abaixo do mínimo</p>
          <p className="mt-1 flex items-center gap-2">
            <span className="text-[26px] font-bold money tracking-[-0.022em]">
              {dashboard?.totalSkusAbaixoMinimo ?? '—'}
            </span>
            {(dashboard?.totalSkusAbaixoMinimo ?? 0) > 0 && (
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: 'var(--danger-soft)', color: 'var(--danger-text)' }}
              >
                repor
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {soAbaixoMinimo ? 'filtrando a lista — clique para limpar' : 'clique para filtrar a lista'}
          </p>
        </button>
        <div className="glass p-5" data-testid="kpi-parados">
          <p className="text-sm text-muted-foreground">Parados há 30 dias</p>
          <p className="mt-1 text-[26px] font-bold money tracking-[-0.022em]">
            {dashboard ? formatBRL(dashboard.valorEstoqueParado) : '—'}
          </p>
          <Link
            href="/estoque/relatorios/parados"
            className="text-xs font-semibold no-underline hover:underline"
            style={{ color: 'var(--accent-text)' }}
          >
            ver relatório →
          </Link>
        </div>
      </div>

      <div className="glass p-4 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
            <Input
              data-testid="busca-estoque"
              aria-label="Buscar produto"
              placeholder="Nome, modelo, cor ou código de barras"
              className="h-12 pl-10"
              value={buscaInput}
              onChange={(e) => mudarFiltro(() => setBuscaInput(e.target.value))}
            />
          </div>
          <Select value={categoria} onValueChange={(v) => mudarFiltro(() => setCategoria(v))}>
            <SelectTrigger data-testid="filtro-categoria" aria-label="Categoria" className="h-12 w-full md:w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {dashboard?.categorias.map((c) => (
                <SelectItem key={c.categoria} value={c.categoria}>
                  {c.categoria} ({c.qtdProdutos})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer min-h-12 select-none">
            <input
              type="checkbox"
              data-testid="toggle-inativos"
              className="size-4 accent-[var(--accent)]"
              checked={mostrarInativos}
              onChange={(e) => mudarFiltro(() => setMostrarInativos(e.target.checked))}
            />
            Mostrar inativos
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="botao-exportar-csv"
              onClick={exportar}
              disabled={exportando}
              className="h-12 px-4 flex items-center gap-2 rounded-[calc(var(--radius)*0.6)] text-sm font-medium transition-transform active:scale-[0.97]"
              style={{ border: '1px solid var(--glass-border)', color: 'var(--fg)' }}
            >
              <Download className="size-4" />
              {exportando ? 'Exportando…' : 'Exportar CSV'}
            </button>
            <Link
              href="/estoque/novo"
              data-testid="botao-novo-produto"
              className="h-12 px-4 flex items-center gap-2 rounded-[calc(var(--radius)*0.6)] text-sm font-semibold no-underline transition-transform active:scale-[0.97] whitespace-nowrap"
              style={{ background: 'var(--accent)', color: 'var(--on-accent)', boxShadow: '0 8px 24px rgba(46, 125, 50, 0.25)' }}
            >
              <Plus className="size-4" />
              Novo produto
            </Link>
          </div>
        </div>

        {carregando ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando produtos…</p>
        ) : produtos.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground" data-testid="estoque-vazio">
            Nenhum produto encontrado.
          </p>
        ) : (
          <>
            <table className="hidden md:table w-full text-sm" data-testid="tabela-estoque">
              <thead>
                <tr className="text-left text-xs text-muted-foreground" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th className="py-2.5 pr-3 font-medium">Nome</th>
                  <th className="py-2.5 pr-3 font-medium">Modelo/Cor</th>
                  <th className="py-2.5 pr-3 font-medium">Categoria</th>
                  <th className="py-2.5 pr-3 font-medium">Estoque</th>
                  <th className="py-2.5 pr-3 font-medium">Preço</th>
                  <th className="py-2.5 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p) => (
                  <tr
                    key={p.id}
                    data-testid={`linha-produto-${p.id}`}
                    onClick={() => router.push(`/estoque/${p.id}`)}
                    className="cursor-pointer transition-colors hover:bg-[var(--accent-soft)]"
                    style={{ borderBottom: '1px solid var(--glass-border)', opacity: p.ativo ? 1 : 0.55 }}
                  >
                    <td className="py-3 pr-3 font-semibold">
                      {p.nome} {!p.ativo && <BadgeInativo />}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {[p.modelo, p.cor].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">{p.categoria ?? '—'}</td>
                    <td className="py-3 pr-3">
                      <span className="money font-semibold">{p.qtdEstoque}</span>{' '}
                      <BadgeAbaixoMinimo produto={p} />
                    </td>
                    <td className="py-3 pr-3 money font-bold" style={{ color: 'var(--accent-text)' }}>
                      {formatBRL(p.precoVenda)}
                    </td>
                    <td className="py-3">
                      <MenuAcoesProduto produto={p} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="md:hidden flex flex-col gap-2.5" data-testid="cards-estoque">
              {produtos.map((p) => (
                <div
                  key={p.id}
                  data-testid={`card-estoque-${p.id}`}
                  className="glass-card p-4 flex items-start gap-3"
                  style={{ opacity: p.ativo ? 1 : 0.55 }}
                >
                  <button
                    type="button"
                    className="flex-1 min-w-0 text-left"
                    onClick={() => router.push(`/estoque/${p.id}`)}
                  >
                    <p className="font-semibold text-[15px] leading-snug">
                      {p.nome} {!p.ativo && <BadgeInativo />}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[p.modelo, p.cor].filter(Boolean).join(' · ') || p.categoria || '—'}
                    </p>
                    <p className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <span className="text-sm money">
                        Estoque: <b>{p.qtdEstoque}</b>
                      </span>
                      <BadgeAbaixoMinimo produto={p} />
                    </p>
                    <p className="mt-1 money font-bold" style={{ color: 'var(--accent-text)' }}>
                      {formatBRL(p.precoVenda)}
                    </p>
                  </button>
                  <MenuAcoesProduto produto={p} />
                </div>
              ))}
            </div>
          </>
        )}

        {!soAbaixoMinimo && (
          <div className="flex items-center justify-between pt-1 text-sm text-muted-foreground">
            <button
              type="button"
              data-testid="paginacao-anterior"
              disabled={pagina === 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              className="px-3 min-h-11 rounded-[calc(var(--radius)*0.5)] disabled:opacity-40"
              style={{ border: '1px solid var(--glass-border)' }}
            >
              ← Anterior
            </button>
            <span data-testid="texto-pagina">Página {pagina}</span>
            <button
              type="button"
              data-testid="paginacao-proxima"
              disabled={!temProxima}
              onClick={() => setPagina((p) => p + 1)}
              className="px-3 min-h-11 rounded-[calc(var(--radius)*0.5)] disabled:opacity-40"
              style={{ border: '1px solid var(--glass-border)' }}
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}