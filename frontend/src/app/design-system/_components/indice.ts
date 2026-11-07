export interface SecaoMeta {
  id: string;
  rotulo: string;
  descricao: string;
  icone: string;
}

/* 14 seções: 4 fundamentais (tokens) + 10 de componentes. A ordem é a da
   página e da sidebar; o scroll spy usa os ids como âncoras. */
export const SECOES_INDEX: SecaoMeta[] = [
  { id: 'secao-colors', rotulo: 'Colors', descricao: 'Tokens de cor, hex, OKLCH e contraste WCAG', icone: 'Palette' },
  { id: 'secao-typography', rotulo: 'Typography', descricao: 'Escala tipográfica Geist, pesos e tabular-nums', icone: 'Type' },
  { id: 'secao-spacing', rotulo: 'Spacing', descricao: 'Escala de espaçamento em múltiplos de 4', icone: 'Ruler' },
  { id: 'secao-motion', rotulo: 'Motion', descricao: 'Springs, easing e prefers-reduced-motion', icone: 'Activity' },
  { id: 'secao-botoes', rotulo: 'Botões', descricao: 'Variantes, tamanhos e estados lado a lado', icone: 'MousePointerClick' },
  { id: 'secao-inputs', rotulo: 'Inputs', descricao: 'Campos, foco, erro e disabled acessíveis', icone: 'TextCursorInput' },
  { id: 'secao-selects', rotulo: 'Selects', descricao: 'Select nativo e dropdown custom', icone: 'ListFilter' },
  { id: 'secao-cards', rotulo: 'Cards', descricao: 'Card de produto, KPI e card genérico em vidro', icone: 'CreditCard' },
  { id: 'secao-badges', rotulo: 'Badges', descricao: 'Selos semânticos com e sem ícone', icone: 'Tag' },
  { id: 'secao-modais', rotulo: 'Modais', descricao: 'Pagamento, confirmação, formulário, destrutivo e folha', icone: 'AppWindow' },
  { id: 'secao-toasts', rotulo: 'Toasts', descricao: 'Notificações success, error, warning e info', icone: 'Bell' },
  { id: 'secao-tabelas', rotulo: 'Tabelas', descricao: 'Cabeçalho, zebra, ações, empty e skeleton', icone: 'Table' },
  { id: 'secao-dropdowns', rotulo: 'Dropdowns', descricao: 'Menu de avatar e ações contextuais', icone: 'List' },
  { id: 'secao-estados', rotulo: 'Estados', descricao: 'Empty states, skeletons e spinner', icone: 'Inbox' },
];