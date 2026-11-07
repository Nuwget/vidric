'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiErrorMessage } from '@/lib/api';
import { parseDecimal } from '@/lib/format';
import { useCriarProduto } from '@/hooks/useEstoque';

export default function NovoProdutoPage() {
  const router = useRouter();
  const criar = useCriarProduto();
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [maisOpcoes, setMaisOpcoes] = useState(false);
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [categoria, setCategoria] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [custo, setCusto] = useState('');
  const [minimo, setMinimo] = useState('');
  const [qtdInicial, setQtdInicial] = useState('');
  const [observacoes, setObservacoes] = useState('');

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    try {
      const produto = await criar.mutateAsync({
        nome: nome.trim(),
        precoVenda: parseDecimal(preco),
        modelo: modelo.trim() || null,
        cor: cor.trim() || null,
        categoria: categoria.trim() || null,
        codigoBarras: codigoBarras.trim() || null,
        custo: parseDecimal(custo),
        estoqueMinimo: Number.parseInt(minimo, 10) || 0,
        qtdEstoque: Number.parseInt(qtdInicial, 10) || 0,
        observacoes: observacoes.trim() || null,
      });
      toast.success('Produto cadastrado.');
      router.replace(`/estoque/${produto.id}`);
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? 'Erro ao cadastrar produto.');
    }
  }

  return (
    <div className="max-w-xl mx-auto pb-4">
      <div className="glass p-6 flex flex-col gap-5">
        <div>
          <Link href="/estoque" className="text-sm text-muted-foreground no-underline hover:underline">
            ← Estoque
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.022em]">Novo produto</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastro rápido: só nome e preço. O resto pode esperar.
          </p>
        </div>

        <form onSubmit={enviar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="novo-nome">Nome</Label>
            <Input
              id="novo-nome"
              data-testid="campo-nome"
              className="h-12"
              placeholder="Ex.: Capinha iPhone 15 Preta"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              maxLength={200}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="novo-preco">Preço de venda</Label>
            <Input
              id="novo-preco"
              data-testid="campo-preco"
              inputMode="decimal"
              className="h-12 money"
              placeholder="45,00"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              required
            />
          </div>

          <button
            type="button"
            data-testid="botao-mais-opcoes"
            aria-expanded={maisOpcoes}
            onClick={() => setMaisOpcoes((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium self-start min-h-11"
            style={{ color: 'var(--accent-text)' }}
          >
            <ChevronDown className={`size-4 transition-transform ${maisOpcoes ? 'rotate-180' : ''}`} />
            Mais opções
          </button>

          {maisOpcoes && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="novo-modelo">Modelo</Label>
                  <Input id="novo-modelo" className="h-12" value={modelo} onChange={(e) => setModelo(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="novo-cor">Cor</Label>
                  <Input id="novo-cor" className="h-12" value={cor} onChange={(e) => setCor(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="novo-categoria">Categoria</Label>
                  <Input id="novo-categoria" className="h-12" placeholder="Capinha, Cabo, Película…" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="novo-barras">Código de barras</Label>
                  <Input id="novo-barras" data-testid="campo-codigo-barras" className="h-12" value={codigoBarras} onChange={(e) => setCodigoBarras(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="novo-custo">Custo</Label>
                  <Input id="novo-custo" inputMode="decimal" className="h-12 money" placeholder="0,00" value={custo} onChange={(e) => setCusto(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="novo-minimo">Estoque mín.</Label>
                  <Input id="novo-minimo" inputMode="numeric" className="h-12 money" placeholder="0" value={minimo} onChange={(e) => setMinimo(e.target.value.replace(/\D/g, ''))} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="novo-qtd">Qtd. inicial</Label>
                  <Input id="novo-qtd" data-testid="campo-qtd-inicial" inputMode="numeric" className="h-12 money" placeholder="0" value={qtdInicial} onChange={(e) => setQtdInicial(e.target.value.replace(/\D/g, ''))} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="novo-obs">Observações</Label>
                <Input id="novo-obs" className="h-12" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} maxLength={1000} />
              </div>
            </div>
          )}

          <button
            type="submit"
            data-testid="botao-salvar-produto"
            disabled={criar.isPending || !nome.trim() || !preco.trim()}
            className="h-12 w-full rounded-[calc(var(--radius)*0.6)] text-base font-semibold transition-transform active:scale-[0.97] disabled:opacity-60"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)', boxShadow: '0 8px 24px rgba(46, 125, 50, 0.25)' }}
          >
            {criar.isPending ? 'Salvando…' : 'Cadastrar produto'}
          </button>
        </form>
      </div>
    </div>
  );
}