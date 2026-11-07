import type { Transition, Variants } from 'framer-motion';

/** Motion padrão do Vidric: spring, nunca ease. */
export const spring: Transition = { type: 'spring', stiffness: 300, damping: 30 };

export const suave: Transition = { type: 'spring', stiffness: 300, damping: 30 };

export const entradaPagina: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: spring },
};

export const entradaLista: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { ...spring, staggerChildren: 0.03 } },
};

export const itemLista: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: spring },
};

export const bottomSheet: Variants = {
  fechado: { y: '105%' },
  aberto: { y: 0, transition: spring },
};

export const drawer: Variants = {
  fechado: { x: '-105%' },
  aberto: { x: 0, transition: spring },
};

export const modal: Variants = {
  fechado: { opacity: 0, scale: 0.96, y: 12 },
  aberto: { opacity: 1, scale: 1, y: 0, transition: spring },
};
