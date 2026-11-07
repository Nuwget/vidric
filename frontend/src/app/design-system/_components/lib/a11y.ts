import { compositeOver, parseColor, ratioEntre, type ParContraste, type RGBA } from './contrast';

export interface AxeNode {
  target: string[];
  html: string;
  failureSummary?: string;
}
export interface AxeRegra {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: AxeNode[];
}
export interface ResultadoAxe {
  geradoEm: string;
  url: string;
  violacoes: AxeRegra[];
  avisos: AxeRegra[];
  passes: number;
  incompletos: number;
  criticoSerio: number;
}

function mapearRegras(regras: unknown[]): AxeRegra[] {
  return (regras as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.id),
    impact: (r.impact as AxeRegra['impact']) ?? null,
    description: String(r.description ?? ''),
    help: String(r.help ?? ''),
    helpUrl: String(r.helpUrl ?? ''),
    nodes: ((r.nodes as Array<Record<string, unknown>>) ?? []).map((n) => ({
      target: (n.target as string[]) ?? [],
      html: String(n.html ?? ''),
      failureSummary: n.failureSummary ? String(n.failureSummary) : undefined,
    })),
  }));
}

/** Executa axe-core na página inteira (WCAG 2 AA + best-practice). */
export async function rodarAuditoriaAxe(): Promise<ResultadoAxe> {
  const axe = (await import('axe-core')).default;
  const res = await axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
    resultTypes: ['violations', 'passes', 'incomplete'],
  });
  const violacoes = mapearRegras(res.violations as unknown as unknown[]);
  const criticoSerio = violacoes.filter((v) => v.impact === 'critical' || v.impact === 'serious').length;
  const avisos = violacoes.filter((v) => v.impact === 'moderate' || v.impact === 'minor');
  return {
    geradoEm: new Date().toISOString(),
    url: location.href,
    violacoes,
    avisos,
    passes: (res.passes as unknown[]).length,
    incompletos: (res.incomplete as unknown[]).length,
    criticoSerio,
  };
}

function fundoEfetivo(el: Element): RGBA {
  let acum: RGBA = { r: 0, g: 0, b: 0, a: 0 };
  let atual: Element | null = el;
  while (atual) {
    const bg = parseColor(getComputedStyle(atual).backgroundColor);
    // Camadas internas (acum) ficam por cima; o ancestral entra por baixo.
    if (bg && bg.a > 0 && Number.isFinite(bg.r) && Number.isFinite(bg.g) && Number.isFinite(bg.b)) {
      acum = compositeOver(acum, bg);
      if (acum.a >= 0.999) return acum;
    }
    atual = atual.parentElement;
  }
  // Sem ancestral opaco (o mesh é background-image): usa o token --bg por baixo.
  const base = parseColor(getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
  if (base && Number.isFinite(base.r)) return compositeOver(acum, base);
  const temaEscuro = document.documentElement.dataset.theme === 'dark';
  return temaEscuro ? { r: 11, g: 11, b: 18, a: 1 } : { r: 255, g: 255, b: 255, a: 1 };
}

const fmt = (c: RGBA) => `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;

/**
 * Varre elementos com texto próprio e calcula o ratio texto/fundo efetivo.
 * Deduplica por par fg+bg+large para o relatório ficar legível.
 */
export function coletarParesContraste(raiz: ParentNode = document): ParContraste[] {
  const vistos = new Map<string, ParContraste>();
  const els = raiz.querySelectorAll<HTMLElement>('body *');
  els.forEach((el) => {
    if (el.closest('[data-no-contrast]')) return;
    // WCAG 1.4.3 exempts inactive controls and purely decorative text.
    if (el.closest('[aria-hidden="true"]')) return;
    if (el.closest('[disabled], [aria-disabled="true"]')) return;
    const texto = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent ?? '').trim().length > 0);
    if (!texto) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) return;
    const fg = parseColor(cs.color);
    if (!fg || fg.a === 0) return;
    const bg = fundoEfetivo(el);
    const px = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = px >= 24 || (px >= 18.66 && bold);
    const ratio = ratioEntre(cs.color, fmt(bg));
    const chave = `${cs.color}|${fmt(bg)}|${large}`;
    if (!vistos.has(chave)) {
      const nome = (el.getAttribute('data-contrast-nome') || el.className.toString().slice(0, 48) || el.tagName.toLowerCase()).trim();
      vistos.set(chave, {
        nome,
        fg: cs.color,
        bg: fmt(bg),
        ratio,
        large,
        passa: ratio !== null && ratio >= (large ? 3 : 4.5),
      });
    }
  });
  return Array.from(vistos.values());
}

export function baixarJson(nomeArquivo: string, dados: unknown): void {
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}