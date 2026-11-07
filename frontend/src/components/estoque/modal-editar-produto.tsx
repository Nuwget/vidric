'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiErrorMessage } from '@/lib/api';
import { parseDecimal } from '@/lib/format';
import { useAtualizarProduto } from '@/hooks/useEstoque';
import type { Produto } from '@/types/api';

interface Props {
  produto: Produto;
  aberto: boolean;
  onFechar: () => void;
}

export function ModalEditarProduto({ produto, aberto, onFechar }: Props) {
  const [nome, setNome] = useState(produto.nome);
  const [modelo, setModelo] = useState(produto.modelo ?? '');
  const [cor, setCor] = useState(produto.cor ?? '');
  const [categoria, setCategoria] = useState(produto.categoria ?? '');
  const [codigoBarras, setCodigoBarras] = useState(produto.codigoBarras ?? '');
  const [preco, setPreco] = useState(String(produto.precoVenda).replace('.', ','));
  const [custo, setCusto] = useState(String(produto.custo).replace('.', ','));
  const [minimo, setMinimo] = useState(String(produto.estoqueMinimo));
  const [observacoes, setObservacoes] = useState(produto.observacoes ?? '');
  const atualizar = useAtualizarProduto(produto.id);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    try {
      await atualizar.mutateAsync({
        nome: nome.trim(),
        modelo: modelo.trim() || null,
        cor: cor.trim() || null,
        categoria: categoria.trim() || null,
        codigoBarras: codigoBarras.trim() || null,
        precoVenda: parseDecimal(preco),
        custo: parseDecimal(custo),
        estoqueMinimo: Number.parseInt(minimo, 10) || 0,
        observacoes: observacoes.trim() || null,
        ativo: produto.ativo,
      });
      toast.success('Produto atualizado.');
      onFechar();
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? 'Erro ao atualizar produto.');
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      {/* utilitários do shadcn vencem o @layer components — ver AGENTS.md */}
      <DialogContent className="glass-modal bg-transparent ring-0 rounded-[var(--modal-radius)] p-6 sm:max-w-lg max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-[-0.022em]">Editar produto</DialogTitle>
          <DialogDescription className="text-sm" style={{ color: 'var(--muted)' }}>
            Dados cadastrais. Estoque só muda por movimento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-nome">Nome</Label>
            <Input id="edit-nome" data-testid="edit-nome" className="h-12" value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={200} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-modelo">Modelo</Label>
              <Input id="edit-modelo" className="h-12" value={modelo} onChange={(e) => setModelo(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-cor">Cor</Label>
              <Input id="edit-cor" className="h-12" value={cor} onChange={(e) => setCor(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-categoria">Categoria</Label>
              <Input id="edit-categoria" className="h-12" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-barras">Código de barras</Label>
              <Input id="edit-barras" className="h-12" value={codigoBarras} onChange={(e) => setCodigoBarras(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-preco">Preço venda</Label>
              <Input id="edit-preco" data-testid="edit-preco" inputMode="decimal" className="h-12 money" value={preco} onChange={(e) => setPreco(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-custo">Custo</Label>
              <Input id="edit-custo" inputMode="decimal" className="h-12 money" value={custo} onChange={(e) => setCusto(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-minimo">Estoque mín.</Label>
              <Input id="edit-minimo" inputMode="numeric" className="h-12 money" value={minimo} onChange={(e) => setMinimo(e.target.value.replace(/\D/g, ''))} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-obs">Observações</Label>
            <Input id="edit-obs" className="h-12" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} maxLength={1000} />
          </div>
          <Button
            type="submit"
            data-testid="botao-salvar-edicao"
            disabled={atualizar.isPending || !nome.trim()}
            className="h-12 w-full text-base font-semibold transition-transform active:scale-[0.97]"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            {atualizar.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}