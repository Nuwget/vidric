import type { Produto } from '@/types/api';

export function BadgeAbaixoMinimo({ produto }: { produto: Pick<Produto, 'abaixoDoMinimo' | 'qtdEstoque'> }) {
  if (!produto.abaixoDoMinimo) return null;
  return (
    <span
      data-testid="badge-abaixo-minimo"
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
      style={{ background: 'var(--danger-soft)', color: 'var(--danger-text)' }}
    >
      {produto.qtdEstoque === 0 ? 'Esgotado' : 'Abaixo do mínimo'}
    </span>
  );
}

export function BadgeInativo() {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
      style={{ background: 'var(--warning-soft)', color: 'var(--warning-text)' }}
    >
      Inativo
    </span>
  );
}