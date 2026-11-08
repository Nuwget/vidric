'use client';

import { useEffect, useMemo, useState } from 'react';

/* Pílulas de período do Financeiro. Persistidas em localStorage (chave
   vidric.financeiro.periodo). Datas em ISO local; o backend normaliza p/ UTC. */
const CHAVE_STORAGE = 'vidric.financeiro.periodo';

export type Preselecao = 'hoje' | '7dias' | 'mesAtual' | 'mesAnterior' | 'custom';

export interface PeriodoFiltroDatas {
  dataInicio: string;
  dataFim: string;
}

const ROTULOS: Record<Exclude<Preselecao, 'custom'>, string> = {
  hoje: 'Hoje',
  '7dias': '7 dias',
  mesAtual: 'Este mês',
  mesAnterior: 'Mês anterior',
};

function inicioDia(d: Date): Date {
  const copia = new Date(d);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function fimDia(d: Date): Date {
  const copia = new Date(d);
  copia.setHours(23, 59, 59, 999);
  return copia;
}

function periodoDe(preselecao: Exclude<Preselecao, 'custom'>): PeriodoFiltroDatas {
  const hoje = inicioDia(new Date());
  switch (preselecao) {
    case 'hoje':
      return { dataInicio: hoje.toISOString(), dataFim: fimDia(hoje).toISOString() };
    case '7dias': {
      const inicio = new Date(hoje);
      inicio.setDate(inicio.getDate() - 6);
      return { dataInicio: inicio.toISOString(), dataFim: fimDia(hoje).toISOString() };
    }
    case 'mesAtual':
      return {
        dataInicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString(),
        dataFim: fimDia(hoje).toISOString(),
      };
    case 'mesAnterior': {
      const primeiro = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const ultimo = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      return { dataInicio: primeiro.toISOString(), dataFim: fimDia(ultimo).toISOString() };
    }
  }
}

export function usePeriodoFinanceiro() {
  const [preselecao, setPreselecao] = useState<Preselecao>('mesAtual');
  const [custom, setCustom] = useState<PeriodoFiltroDatas | null>(null);
  const [restaurado, setRestaurado] = useState(false);

  useEffect(() => {
    try {
      const bruto = localStorage.getItem(CHAVE_STORAGE);
      if (bruto) {
        const salvo = JSON.parse(bruto) as { preselecao: Preselecao; custom: PeriodoFiltroDatas | null };
        if (salvo.preselecao === 'custom' && salvo.custom) {
          setCustom(salvo.custom);
          setPreselecao('custom');
        } else if (salvo.preselecao !== 'custom') {
          setPreselecao(salvo.preselecao);
        }
      }
    } catch {
      /* storage corrompido: fica no default */
    }
    setRestaurado(true);
  }, []);

  const periodo: PeriodoFiltroDatas = useMemo<PeriodoFiltroDatas>(() => {
    if (preselecao !== 'custom') return periodoDe(preselecao);
    return custom ?? periodoDe('mesAtual');
  }, [preselecao, custom]);

  const selecionar = (novo: Preselecao, datas?: PeriodoFiltroDatas) => {
    if (novo === 'custom' && datas) setCustom(datas);
    setPreselecao(novo);
    if (restaurado) {
      const efetivo = novo === 'custom' ? (datas ?? custom) : null;
      localStorage.setItem(
        CHAVE_STORAGE,
        JSON.stringify({ preselecao: novo, custom: efetivo }),
      );
    }
  };

  return { preselecao, periodo, custom, selecionar };
}

export function PeriodSelector({
  preselecao,
  onSelecionar,
  custom,
}: {
  preselecao: Preselecao;
  onSelecionar: (novo: Preselecao, datas?: PeriodoFiltroDatas) => void;
  custom: PeriodoFiltroDatas | null;
}) {
  const dataInicioInput = custom?.dataInicio.slice(0, 10) ?? '';
  const dataFimInput = custom?.dataFim.slice(0, 10) ?? '';

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="seletor-periodo">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Período do relatório">
        {(Object.keys(ROTULOS) as Array<Exclude<Preselecao, 'custom'>>).map((chave) => (
          <button
            key={chave}
            type="button"
            data-testid={`periodo-${chave}`}
            aria-pressed={preselecao === chave}
            onClick={() => onSelecionar(chave)}
            className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
            style={
              preselecao === chave
                ? { background: 'var(--accent)', color: 'var(--on-accent)' }
                : { background: 'var(--surface)', color: 'var(--muted)' }
            }
          >
            {ROTULOS[chave]}
          </button>
        ))}
        <button
          type="button"
          data-testid="periodo-custom"
          aria-pressed={preselecao === 'custom'}
          onClick={() => onSelecionar('custom', custom ?? { dataInicio: new Date().toISOString(), dataFim: new Date().toISOString() })}
          className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
          style={
            preselecao === 'custom'
              ? { background: 'var(--accent)', color: 'var(--on-accent)' }
              : { background: 'var(--surface)', color: 'var(--muted)' }
          }
        >
          Personalizado
        </button>
      </div>
      {preselecao === 'custom' && (
        <div className="flex items-center gap-2" data-testid="datas-custom">
          <label className="text-xs text-muted-foreground">
            De{' '}
            <input
              type="date"
              data-testid="data-inicio"
              defaultValue={dataInicioInput}
              onChange={(e) => {
                const inicio = e.target.value;
                if (inicio) onSelecionar('custom', { dataInicio: new Date(`${inicio}T00:00:00`).toISOString(), dataFim: custom?.dataFim ?? new Date().toISOString() });
              }}
              className="rounded-md border px-2 py-1 text-xs"
              style={{ borderColor: 'var(--glass-border)', background: 'var(--surface)', color: 'var(--fg)' }}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            até{' '}
            <input
              type="date"
              data-testid="data-fim"
              defaultValue={dataFimInput}
              onChange={(e) => {
                const fim = e.target.value;
                if (fim) onSelecionar('custom', { dataInicio: custom?.dataInicio ?? new Date().toISOString(), dataFim: new Date(`${fim}T23:59:59`).toISOString() });
              }}
              className="rounded-md border px-2 py-1 text-xs"
              style={{ borderColor: 'var(--glass-border)', background: 'var(--surface)', color: 'var(--fg)' }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
