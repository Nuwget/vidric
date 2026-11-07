'use client';

import { SecaoBadges } from './secoes/badges';
import { SecaoBotoes } from './secoes/botoes';
import { SecaoCards } from './secoes/cards';
import { SecaoColors } from './secoes/colors';
import { SecaoDropdowns } from './secoes/dropdowns';
import { SecaoEstados } from './secoes/estados';
import { SecaoInputs } from './secoes/inputs';
import { SecaoModais } from './secoes/modais';
import { SecaoMotion } from './secoes/motion';
import { SecaoSelects } from './secoes/selects';
import { SecaoSpacing } from './secoes/spacing';
import { SecaoTabelas } from './secoes/tabelas';
import { SecaoToasts } from './secoes/toasts';
import { SecaoTypography } from './secoes/typography';

/* Ordem idêntica à sidebar (indice.ts): 4 fundações + 10 componentes. Os
   articles são filhos diretos do <main>, que aplica gap-16 entre seções. */
const SECOES = [
  SecaoColors,
  SecaoTypography,
  SecaoSpacing,
  SecaoMotion,
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
    <>
      {SECOES.map((Secao, i) => (
        <Secao key={i} />
      ))}
    </>
  );
}