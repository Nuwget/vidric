'use client';

import { useEffect, useState, type FormEvent } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiErrorMessage } from '@/lib/api';
import { useRegistrarMovimento } from '@/hooks/useEstoque';
import type { Produto, RegistrarMovimentoInput } from '@/types/api';

export type AcaoEstoque = 'entrada' | 'ajuste' | 'perda' | 'devolucao';

const TITULOS: Record<AcaoEstoque, string> = {
  entrada: 'Entrada de estoque',
  ajuste: 'Ajuste de estoque',
  perda: 'Registrar perda',
  devolucao: 'Registrar devolução',
};

const TIPO_PADRAO: Record<AcaoEstoque, RegistrarMovimentoInput['tipo']> = {
  entrada: 'EntradaCompra',
  ajuste: 'AjustePositivo',
  perda: 'Perda',
  devolucao: 'Devolucao',
};

interface Props {
  produto: Produto;
  acao: AcaoEstoque | null;
  onFechar: () => void;
}

export function ModalMovimento({ produto, acao, onFechar }: Props) {
  const [quantidade, setQuantidade] = useState('1');
  const [motivo, setMotivo] = useState('');
  const [tipoAjuste, setTipoAjuste] = useState<'AjustePositivo' | 'AjusteNegativo'>('AjustePositivo');
  const registrar = useRegistrarMovimento(produto.id);

  const qtd = Number.parseInt(quantidade, 10);
  const motivoObrigatorio = acao === 'perda';
  const valido = Number.isInteger(qtd) && qtd > 0 && (!motivoObrigatorio || motivo.trim().length > 0);

  useEffect(() => {
    if (acao) {
      setQuantidade('1');
      setMotivo('');
      setTipoAjuste('AjustePositivo');
    }
  }, [acao]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!valido || !acao) return;
    try {
      await registrar.mutateAsync({
        tipo: acao === 'ajuste' ? tipoAjuste : TIPO_PADRAO[acao],
        quantidade: qtd,
        motivo: motivo.trim() || null,
      });
      toast.success('Movimento registrado.');
      onFechar();
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? 'Erro ao registrar movimento.');
    }
  }

  return (
    <Dialog
      open={acao !== null}
      onOpenChange={(aberto) => {
        if (!aberto) onFechar();
      }}
    >
      {/* utilitários do shadcn vencem o @layer components — ver AGENTS.md */}
      <DialogContent className="glass-modal bg-transparent ring-0 rounded-[var(--modal-radius)] p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-[-0.022em]">
            {acao ? TITULOS[acao] : ''}
          </DialogTitle>
          <DialogDescription className="text-sm" style={{ color: 'var(--muted)' }}>
            {produto.nome} · estoque atual: {produto.qtdEstoque}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} className="flex flex-col gap-4">
          {acao === 'ajuste' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="tipo-ajuste">Tipo de ajuste</Label>
              <Select
                value={tipoAjuste}
                onValueChange={(v) => setTipoAjuste(v as 'AjustePositivo' | 'AjusteNegativo')}
              >
                <SelectTrigger id="tipo-ajuste" data-testid="select-tipo-ajuste" className="h-12 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AjustePositivo">Ajuste positivo (+)</SelectItem>
                  <SelectItem value="AjusteNegativo">Ajuste negativo (−)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="mov-quantidade">Quantidade</Label>
            <Input
              id="mov-quantidade"
              data-testid="campo-quantidade"
              inputMode="numeric"
              className="h-12 money"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="mov-motivo">
              Motivo {motivoObrigatorio ? '' : '(opcional)'}
            </Label>
            <Input
              id="mov-motivo"
              data-testid="campo-motivo"
              className="h-12"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required={motivoObrigatorio}
              placeholder={motivoObrigatorio ? 'Ex.: quebra, defeito, extravio' : 'Ex.: compra do fornecedor'}
            />
          </div>

          <Button
            type="submit"
            data-testid="botao-confirmar-movimento"
            disabled={!valido || registrar.isPending}
            className="h-12 w-full text-base font-semibold transition-transform active:scale-[0.97]"
            style={{
              background: acao === 'perda' ? 'var(--danger)' : 'var(--accent)',
              color: 'var(--on-accent)',
            }}
          >
            {registrar.isPending ? 'Registrando…' : 'Confirmar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}