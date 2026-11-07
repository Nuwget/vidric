import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { SECOES_INDEX } from '../src/app/design-system/_components/indice';
import { ratioEntre } from '../src/app/design-system/_components/lib/contrast';

/* WCAG AA transversal (PARTE 5). Roda axe-core na página inteira em
   light/dark × 1440/375 e exige zero violações critical/serious. Gera o
   design-system-a11y-report.json commitado com os 4 combos + pares de contraste. */

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
const REPORT_PATH = path.join(__dirname, '..', 'design-system-a11y-report.json');

async function abrir(page: Page) {
  await page.goto('/design-system');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  await expect(page.getByTestId('design-system')).toBeVisible();
  await page.waitForTimeout(700);
}

async function definirTema(page: Page, tema: 'light' | 'dark', largura: number) {
  const atual = await page.evaluate(() => document.documentElement.dataset.theme);
  if (atual === tema) return;
  if (largura === 375) {
    await page.getByTestId('abrir-painel').click();
    await page.getByTestId('painel-folha').getByTestId('switch-tema').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', tema);
    await page.getByRole('button', { name: 'Fechar painel' }).click();
    await expect(page.getByTestId('painel-folha')).toBeHidden();
  } else {
    await page.getByTestId('painel-desktop').getByTestId('switch-tema').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', tema);
  }
  await page.waitForTimeout(400);
}

interface Combo {
  viewport: number;
  tema: string;
  criticoSerio: number;
  passes: number;
  incompletos: number;
  violacoes: Array<{ id: string; impact: string | null; help: string; nodes: number }>;
}

test('A1 (checklist 22–25): axe WCAG AA nos 4 combos — zero critical/serious + report', async ({ page }) => {
  test.setTimeout(300_000);
  await abrir(page);
  const combos: Combo[] = [];

  for (const largura of [1440, 375]) {
    await page.setViewportSize({ width: largura, height: largura === 1440 ? 900 : 812 });
    await page.waitForTimeout(400);
    for (const tema of ['light', 'dark'] as const) {
      await definirTema(page, tema, largura);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      const res = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      const critSer = res.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
      combos.push({
        viewport: largura,
        tema,
        criticoSerio: critSer.length,
        passes: res.passes.length,
        incompletos: res.incomplete.length,
        violacoes: res.violations.map((v) => ({ id: v.id, impact: v.impact ?? null, help: v.help, nodes: v.nodes.length })),
      });
      expect(
        critSer.map((v) => `${v.id}: ${v.help} :: ${v.nodes.map((n) => `[${n.target.join(' ')}] ${n.html}`).join(' | ')}`),
        `axe critical/serious em ${tema}/${largura}`,
      ).toEqual([]);
    }
  }

  // Pares de contraste reais: roda a auditoria in-app e captura o JSON exportado
  // (mesma rotina coletarParesContraste que alimenta a barra WCAG AA).
  await page.setViewportSize({ width: 1440, height: 900 });
  await definirTema(page, 'dark', 1440);
  await page.getByTestId('botao-auditar-axe').click();
  await expect(page.getByTestId('resultado-axe')).toBeVisible({ timeout: 30_000 });
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('botao-exportar-relatorio').click(),
  ]);
  const appReport = JSON.parse(readFileSync((await download.path())!, 'utf8'));

  const totalCriticoSerio = combos.reduce((s, c) => s + c.criticoSerio, 0);
  const report = {
    geradoEm: new Date().toISOString(),
    url: page.url(),
    totalCriticoSerio,
    combos,
    contraste: appReport.contraste ?? [],
    contrasteResumo: {
      total: (appReport.contraste ?? []).length,
      passando: (appReport.contraste ?? []).filter((p: { passa: boolean }) => p.passa).length,
    },
    auditoriaApp: { passes: appReport.passes, incompletos: appReport.incompletos, criticoSerio: appReport.criticoSerio },
  };
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  expect(totalCriticoSerio).toBe(0);
  expect(report.contrasteResumo.total).toBeGreaterThan(0);
});

test('A2 (checklist 18): skip link, ⌘K e navegação por teclado na sidebar', async ({ page }) => {
  await abrir(page);
  await expect(page.getByRole('navigation', { name: 'Seções do design system' }).getByRole('link')).toHaveCount(SECOES_INDEX.length);
  // Skip link é o primeiro foco da página.
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Pular para o conteúdo' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#conteudo')).toBeFocused();

  // ⌘K / Ctrl+K foca a busca.
  await page.keyboard.press('Control+k');
  await expect(page.getByTestId('busca-secoes')).toBeFocused();

  // Busca fuzzy filtra a sidebar (nome + descrição).
  await page.getByTestId('busca-secoes').fill('typography');
  await expect(page.getByTestId('nav-secao-typography')).toBeVisible();
  await expect(page.getByTestId('nav-secao-modais')).toHaveCount(0);
  await page.getByTestId('busca-secoes').fill('');

  // Link da sidebar navega e marca aria-current.
  await page.getByTestId('nav-secao-badges').click();
  await expect(page.getByTestId('nav-secao-badges')).toHaveAttribute('aria-current', 'true');
  await expect(page.getByTestId('breadcrumb-secao')).toHaveText('Badges');
});

test('A3 (checklist 19): modal real tem aria-modal, focus trap e Esc', async ({ page }) => {
  await abrir(page);
  await page.getByTestId('abrir-modal-formulario').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(dialog).toHaveAttribute('aria-labelledby', /.+/);
  // Foco inicial dentro do modal.
  await expect.poll(() => dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  // Tab cicla sem escapar do modal.
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('A4 (checklist 20): dropdown com setas, Esc e aria-expanded', async ({ page }) => {
  await abrir(page);
  const trigger = page.getByTestId('ds-acoes');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const editar = page.getByRole('menuitem', { name: 'Editar' });
  await expect(editar).toBeVisible();
  await editar.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Duplicar' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(editar).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('A5 (checklist 30): pares de contraste dos tokens principais passam AA', async ({ page }) => {
  // Matemática WCAG pura (node-side): tokens reais do playground, light e dark.
  const casos: Array<[string, string, string, number]> = [
    ['fg light', '#1d1d1f', '#ffffff', 4.5],
    ['accent-text light', '#2e7d32', '#ffffff', 4.5],
    ['fg dark', '#f5f5f7', '#0b0b12', 4.5],
    ['accent-text dark', '#86b488', '#0b0b12', 4.5],
    ['on-accent / accent', '#ffffff', '#2e7d32', 4.5],
  ];
  for (const [nome, fg, bg, minimo] of casos) {
    const ratio = ratioEntre(fg, bg);
    expect(ratio, `${nome} (${fg} sobre ${bg})`).not.toBeNull();
    expect(ratio!, `${nome}: ${ratio}:1`).toBeGreaterThanOrEqual(minimo);
  }

  // A barra ao vivo reflete a varredura real da página.
  await abrir(page);
  const barra = page.getByTestId('barra-a11y');
  await expect(barra).toContainText('pares passando');
  await expect.poll(async () => {
    const txt = (await barra.textContent()) ?? '';
    const m = txt.match(/(\d+)\/(\d+)/);
    return m ? Number(m[2]) : 0;
  }).toBeGreaterThan(0);
});

test('A6 (checklist 21): toggles de reduced-motion e contrast-more aplicam datasets', async ({ page }) => {
  await abrir(page);
  await page.getByTestId('switch-reduced-motion').click();
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await page.getByTestId('switch-contrast').click();
  await expect(page.locator('html')).toHaveAttribute('data-contrast', 'more');
  // font scale 125% muda o font-size raiz.
  await page.getByTestId('slider-font-scale').getByRole('slider').press('ArrowRight');
  await expect.poll(() => page.evaluate(() => document.documentElement.style.fontSize)).toBe('125%');
});