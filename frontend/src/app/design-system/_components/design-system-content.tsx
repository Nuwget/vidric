'use client';

import { motion } from 'framer-motion';
import { entradaLista, itemLista } from '@/lib/motion';
import { SecaoBadges } from './secoes/badges';
import { SecaoBotoes } from './secoes/botoes';
import { SecaoCards } from './secoes/cards';
import { SecaoDropdowns } from './secoes/dropdowns';
import { SecaoEstados } from './secoes/estados';
import { SecaoInputs } from './secoes/inputs';
import { SecaoModais } from './secoes/modais';
import { SecaoSelects } from './secoes/selects';
import { SecaoTabelas } from './secoes/tabelas';
import { SecaoToasts } from './secoes/toasts';

const SECOES = [
  SecaoBotoes,
  SecaoInputs,
  SecaoSelects,
  SecaoCards,
  SecaoBadges,
  SecaoModais,
  SecaoToasts,
  SecaoTabelas,
  SecaoDropdowns,
  SecaoEstados,
];

export function DesignSystemContent() {
  return (
    <motion.div variants={entradaLista} initial="initial" animate="animate" className="flex flex-col gap-6">
      {SECOES.map((Secao, i) => (
        <motion.div key={i} variants={itemLista}>
          <Secao />
        </motion.div>
      ))}
    </motion.div>
  );
}