'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion, useAnimationControls } from 'framer-motion';
import { useCaixaAtual } from '@/hooks/useCaixa';
import { ouvirCaixaFechado } from '@/lib/caixa-aviso';

export function CaixaStatusBanner({ habilitado }: { habilitado: boolean }) {
  const { caixaAberto, carregando } = useCaixaAtual(habilitado);
  const [destaque, setDestaque] = useState(false);
  const controles = useAnimationControls();

  useEffect(() => {
    if (!habilitado) return;
    return ouvirCaixaFechado(() => {
      setDestaque(true);
      void controles.start({
        x: [0, -6, 6, -4, 4, 0],
        transition: { duration: 0.42 },
      });
    });
  }, [habilitado, controles]);

  useEffect(() => {
    if (!destaque) return;
    const timer = setTimeout(() => setDestaque(false), 4000);
    return () => clearTimeout(timer);
  }, [destaque]);

  if (!habilitado || carregando || caixaAberto) return null;

  return (
    <motion.div
      role="status"
      animate={controles}
      className="flex items-center gap-2 px-4 py-3 text-sm font-medium"
      style={{
        background: 'var(--warning-soft)',
        color: 'var(--warning-text)',
        borderRadius: 'calc(var(--radius) * 0.6)',
        border: destaque ? '1px solid var(--warning)' : '1px solid transparent',
        boxShadow: 'var(--shadow)',
      }}
    >
      <AlertTriangle className="size-4 shrink-0" />
      Caixa fechado. Abra o caixa para vender em dinheiro.
    </motion.div>
  );
}
