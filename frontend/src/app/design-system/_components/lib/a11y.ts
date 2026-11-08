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

/* O fill do vidro vive em background-image (receita sem pseudos):
   linear-gradient(cor, cor) é uma camada uniforme mensurable. */
function partirTopLevel(s: string): string[] {
  const partes: string[] = [];
  let prof = 0;
  let atual = '';
  for (const ch of s) {
    if (ch === '(') prof++;
    else if (ch === ')') prof--;
    if (ch === ',' && prof === 0) {
      partes.push(atual.trim());
      atual = '';
    } else atual += ch;
  }
  partes.push(atual.trim());
  return partes;
}

function camadasUniformes(backgroundImage: string): RGBA[] {
  const camadas: RGBA[] = [];
  const re = /linear-gradient\(((?:[^()]|\([^()]*\))*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(backgroundImage))) {
    const args = partirTopLevel(m[1]);
    if (args.length !== 2) continue;
    const a = parseColor(args[0]);
    const b = parseColor(args[1]);
    if (a && b && a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a && a.a > 0) camadas.push(a);
  }
  return camadas;
}

function camadaValida(c: RGBA | null): c is RGBA {
  return !!c && c.a > 0 && Number.isFinite(c.r) && Number.isFinite(c.g) && Number.isFinite(c.b);
}

function fundoEfetivo(el: Element): RGBA {
  // Camadas de dentro para fora; a compilação final inverte (ancestral por baixo).
  const camadas: RGBA[] = [];
  let atual: Element | null = el;
  while (atual) {
    const cs = getComputedStyle(atual);
    const bg = parseColor(cs.backgroundColor);
    if (camadaValida(bg)) camadas.push(bg);
    camadas.push(...camadasUniformes(cs.backgroundImage).filter(camadaValida));
    atual = atual.parentElement;
  }
  // Sem ancestral opaco (o mesh é background-image): usa o token --bg por baixo.
  const base = parseColor(getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
  let fundo: RGBA =
    base && Number.isFinite(base.r)
      ? base
      : document.documentElement.dataset.theme === 'dark'
        ? { r: 11, g: 11, b: 18, a: 1 }
        : { r: 255, g: 255, b: 255, a: 1 };
  // Sem break anticipado: o body é opaco, mas as camadas internas (fill do
  // vidro, bg do próprio elemento) precisam ser compostas por cima dele.
  for (let i = camadas.length - 1; i >= 0; i--) {
    fundo = compositeOver(camadas[i], fundo);
  }
  return fundo;
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