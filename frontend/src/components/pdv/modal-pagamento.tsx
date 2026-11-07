'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatBRL, onlyDigits, parseDecimal, formatCpf } from '@/lib/format';
import type { FormaPagamento } from '@/types/api';

const FORMAS: { valor: FormaPagamento; rotulo: string }[] = [
  { valor: 'Pix', rotulo: 'Pix' },
  { valor: 'Dinheiro', rotulo: 'Dinheiro' },
  { valor: 'CartaoDebito', rotulo: 'Cartão de débito' },
  { valor: 'CartaoCredito', rotulo: 'Cartão de crédito' },
  { valor: 'Outro', rotulo: 'Outro' },
];

const ESTILO_VIDRO = {
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(var(--glass-blur))',
  WebkitBackdropFilter: 'blur(var(--glass-blur))',
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--shadow)',
} as const;

function comoTextoBRL(valor: number): string {
  return valor.toFixed(2).replace('.', ',');
}

interface Props {
  aberto: boolean;
  total: number;
  salvando: boolean;
  onFechar: () => void;
  onConfirmar: (dados: { forma: FormaPagamento; valor: number; cpf: string | null }) => void;
}

export function ModalPagamento({ aberto, total, salvando, onFechar, onConfirmar }: Props) {
  const [forma, setForma] = useState<FormaPagamento>('Pix');
  const [valorTexto, setValorTexto] = useState('');
  const [cpfTexto, setCpfTexto] = useState('');
  const [erroValor, setErroValor] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    setValorTexto(comoTextoBRL(total));
    setErroValor(null);
  }, [aberto, total]);

  const valorPago = useMemo(() => {
    const texto = valorTexto.trim();
    if (!texto) return total;
    return parseDecimal(texto);
  }, [valorTexto, total]);

  const saldo = Math.max(0, Math.round((total - valorPago) * 100) / 100);
  const cpfDigitos = onlyDigits(cpfTexto);
  const erroCpf = cpfDigitos.length > 0 && cpfDigitos.length !== 11;
  const excedeTotal = valorPago > total + 0.005;

  function confirmar() {
    if (erroCpf || valorPago <= 0) return;
    if (excedeTotal) {
      setErroValor('O valor pago não pode ser maior que o total.');
      return;
    }
    setErroValor(null);
    onConfirmar({ forma, valor: valorPago, cpf: cpfDigitos.length === 11 ? cpfDigitos : null });
  }

  return (
    <Dialog open={aberto} onOpenChange={(novo) => (novo ? undefined : onFechar())}>
      <DialogContent className="rounded-[var(--radius)] sm:max-w-md p-6 ring-0" style={ESTILO_VIDRO}>
        <DialogHeader>
          <DialogTitle>Pagamento</DialogTitle>
          <DialogDescription className="text-sm" style={{ color: 'var(--muted)' }}>
            Recebimento parcial vira fiado e fica no relatório “a receber”.
          </DialogDescription>
        </DialogHeader>

        <div
          className="flex items-baseline justify-between px-4 py-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'calc(var(--radius)*0.7)' }}
        >
          <span className="text-sm" style={{ color: 'var(--muted)' }}>
            Total da venda
          </span>
          <span data-testid="pagamento-total" className="text-2xl font-bold money">
            {formatBRL(total)}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="forma-pagamento">Forma</Label>
          <Select value={forma} onValueChange={(v) => setForma(v as FormaPagamento)}>
            <SelectTrigger id="forma-pagamento" className="h-12 w-full">
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
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="valor-pago">Valor pago</Label>
          <Input
            id="valor-pago"
            data-testid="valor-pago"
            inputMode="decimal"
            className="h-12 money"
            value={valorTexto}
            aria-invalid={erroValor !== null}
            onChange={(e) => {
              setValorTexto(e.target.value);
              setErroValor(null);
            }}
            onBlur={() => setValorTexto(comoTextoBRL(valorPago))}
          />
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--muted)' }}>
              {valorPago < total ? 'Recebido parcial' : 'Recebido total'}
            </span>
            <span
              data-testid="saldo"
              className="font-semibold money"
              style={{ color: saldo > 0 ? 'var(--danger-text)' : 'var(--accent-text)' }}
            >
              Saldo {formatBRL(saldo)}
            </span>
          </div>
          {erroValor && (
            <p role="alert" className="text-sm font-semibold" style={{ color: 'var(--danger-text)' }}>
              {erroValor}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="cpf-cliente">CPF do cliente (opcional)</Label>
          <Input
            id="cpf-cliente"
            data-testid="cpf-cliente"
            inputMode="numeric"
            placeholder="000.000.000-00"
            maxLength={14}
            className="h-12 money"
            value={cpfTexto}
            aria-invalid={erroCpf}
            onChange={(e) => setCpfTexto(formatCpf(e.target.value))}
          />
          {erroCpf && (
            <p role="alert" data-testid="erro-cpf" className="text-sm font-semibold" style={{ color: 'var(--danger-text)' }}>
              CPF incompleto: informe os 11 dígitos ou deixe vazio.
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-1">
          <button
            type="button"
            onClick={onFechar}
            className="flex-1 font-semibold"
            style={{
              minHeight: 48,
              background: 'transparent',
              color: 'var(--fg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'calc(var(--radius)*0.7)',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            data-testid="confirmar-pagamento"
            disabled={salvando || erroCpf || valorPago <= 0}
            onClick={confirmar}
            className="flex-[1.4] font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{
              minHeight: 48,
              background: 'var(--accent)',
              color: 'var(--on-accent)',
              border: 'none',
              borderRadius: 'calc(var(--radius)*0.7)',
            }}
          >
            {salvando && <Loader2 className="size-4 animate-spin" />}
            Confirmar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
