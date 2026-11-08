'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatBRL } from '@/lib/format';
import type { DashboardFinanceiro } from '@/types/api';

interface Props {
  dashboard?: DashboardFinanceiro;
}

export function TresNumeros({ dashboard }: Props) {
  const carregando = !dashboard;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5" data-testid="financeiro-tres-numeros">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="glass p-5"
        style={{ background: 'var(--accent)', borderColor: 'transparent' }}
        data-testid="card-vendido"
      >
        <p className="text-sm font-medium" style={{ color: 'var(--on-accent)' }}>Vendido</p>
        <div aria-label={carregando ? 'Vendido: carregando' : `Vendido: ${formatBRL(dashboard.vendido)}`}>
          {carregando ? (
            <span className="mt-2 block h-10 w-40 rounded-md animate-pulse" style={{ background: 'rgba(255,255,255,0.25)' }} />
          ) : (
            <p className="mt-1.5 text-[40px] md:text-[48px] font-bold tabular-nums tracking-tight leading-none" style={{ color: 'var(--on-accent)' }}>
              {formatBRL(dashboard.vendido)}
            </p>
          )}
        </div>
        <p className="mt-2 text-xs" style={{ color: 'var(--on-accent)' }}>
          Faturamento no período (inclui fiado não pago)
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.04 }}
        className="glass p-5"
        style={{ background: '#1565c0', borderColor: 'transparent' }}
        data-testid="card-recebido"
      >
        <p className="text-sm font-medium text-white">Recebido</p>
        <div aria-label={carregando ? 'Recebido: carregando' : `Recebido: ${formatBRL(dashboard.recebido)}`}>
          {carregando ? (
            <span className="mt-2 block h-10 w-40 rounded-md animate-pulse" style={{ background: 'rgba(255,255,255,0.25)' }} />
          ) : (
            <p className="mt-1.5 text-[40px] md:text-[48px] font-bold tabular-nums tracking-tight leading-none text-white">
              {formatBRL(dashboard.recebido)}
            </p>
          )}
        </div>
        <p className="mt-2 text-xs text-white">
          Entrou no caixa/período (inclui fiado antigo pago agora)
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.08 }}
        className="glass p-5"
        data-testid="card-em-aberto"
      >
        <p className="text-sm text-muted-foreground">Em aberto</p>
        <Link
          href="/financeiro/a-receber"
          className="block no-underline"
          aria-label={carregando ? 'Em aberto: carregando' : `Em aberto: ${formatBRL(dashboard.emAberto)} — ver fiado a receber`}
          style={{ color: 'inherit' }}
        >
          {carregando ? (
            <span className="mt-2 block h-10 w-40 rounded-md animate-pulse bg-[var(--warning-soft)]" />
          ) : (
            <p className="mt-1.5 text-[40px] md:text-[48px] font-bold tabular-nums tracking-tight leading-none" style={{ color: 'var(--warning-text)' }}>
              {formatBRL(dashboard.emAberto)}
            </p>
          )}
        </Link>
        <p className="mt-2 text-xs text-muted-foreground">
          Total fiado a receber (acumulado, não filtrado pelo período)
        </p>
      </motion.div>
    </div>
  );
}
