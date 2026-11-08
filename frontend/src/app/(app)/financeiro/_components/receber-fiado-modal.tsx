'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRegistrarPagamento } from '@/hooks/useFinanceiro';
import { avisarCaixaFechado } from '@/lib/caixa-aviso';
import { formatBRL, parseDecimal } from '@/lib/format';
import type { FormaPagamento, VendaAReceber } from '@/types/api';

const FORMAS: Array<{ valor: FormaPagamento; rotulo: string }> = [
  { valor: 'Pix', rotulo: 'Pix' },
  { valor: 'Dinheiro', rotulo: 'Dinheiro' },
  { valor: 'CartaoDebito', rotulo: 'Cartão Débito' },
  { valor: 'CartaoCredito', rotulo: 'Cartão Crédito' },
  { valor: 'Outro', rotulo: 'Outro' },
];

interface Props {
  venda: VendaAReceber | null;
  onFechar: () => void;
}

export function ReceberFiadoModal({ venda, onFechar }: Props) {
  const [valorInput, setValorInput] = useState('');
  const [forma, setForma] = useState<FormaPagamento>('Pix');
  const registrar = useRegistrarPagamento(venda?.id ?? '');

  useEffect(() => {
    if (venda) {
      setValorInput(venda.saldo.toFixed(2).replace('.', ','));
      setForma('Pix');
    }
  }, [venda]);

  async function confirmar() {
    if (!venda) return;
    const valor = parseDecimal(valorInput);
    if (valor <= 0) {
      toast.error('Valor do pagamento deve ser maior que zero.');
      return;
    }
    try {
      await registrar.mutateAsync({ forma, valor });
      toast.success(`Pagamento de ${formatBRL(valor)} registrado.`);
      onFechar();
    } catch (error) {
      const erro =
        (error as { response?: { data?: { erro?: string } } }).response?.data?.erro ??
        (error as { message?: string }).message ??
        'Erro ao registrar pagamento.';
      toast.error(erro);
      if (erro.includes('Abra o caixa')) avisarCaixaFechado();
    }
  }

  return (
    <Dialog open={Boolean(venda)} onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="sm:max-w-md" data-testid="modal-receber-fiado">
        <DialogHeader>
          <DialogTitle>Receber fiado</DialogTitle>
          <DialogDescription>
            {venda && (
              <>
                Total da venda {formatBRL(venda.total)} · saldo em aberto{' '}
                <b className="tabular-nums" style={{ color: 'var(--warning-text)' }}>
                  {formatBRL(venda.saldo)}
                </b>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-1">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Valor recebido
            <Input
              data-testid="input-valor-pagamento"
              aria-label="Valor recebido"
              inputMode="decimal"
              value={valorInput}
              onChange={(e) => setValorInput(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Forma de pagamento
            <Select value={forma} onValueChange={(v) => setForma(v as FormaPagamento)}>
              <SelectTrigger data-testid="select-forma-pagamento" aria-label="Forma de pagamento">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAS.map((f) => (
                  <SelectItem key={f.valor} value={f.valor}>
                    {f.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar} data-testid="botao-cancelar-pagamento">
            Cancelar
          </Button>
          <Button
            data-testid="botao-confirmar-pagamento"
            onClick={confirmar}
            disabled={registrar.isPending}
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            {registrar.isPending ? 'Registrando…' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
