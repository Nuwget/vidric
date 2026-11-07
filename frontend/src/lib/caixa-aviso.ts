export const EVENTO_CAIXA_FECHADO = 'vidric:caixa-fechado';

/** Sinal usado pelo PDV quando uma venda em dinheiro falha por caixa fechado. */
export function avisarCaixaFechado(): void {
  window.dispatchEvent(new Event(EVENTO_CAIXA_FECHADO));
}

export function ouvirCaixaFechado(callback: () => void): () => void {
  window.addEventListener(EVENTO_CAIXA_FECHADO, callback);
  return () => window.removeEventListener(EVENTO_CAIXA_FECHADO, callback);
}
