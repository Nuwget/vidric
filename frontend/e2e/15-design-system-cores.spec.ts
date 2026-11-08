import { expect, test, type Page } from '@playwright/test';

/*
  Feature A — color pickers do painel da /design-system.
  A derivação esperada é a do apply() do playground, escrita aqui à mão:
  se o painel divergir do playground, estes testes quebram.
*/

const varInline = (page: Page, nome: string) =>
  page.evaluate((k) => document.documentElement.style.getPropertyValue(k), nome);

/** input[type=color] não aceita fill(); usa o setter nativo + evento input (React). */
async function escolherCor(page: Page, chave: string, hex: string) {
  await page.getByTestId(`picker-${chave}`).evaluate((el, valor) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(el, valor);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, hex);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/design-system');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByTestId('painel-controle')).toBeVisible();
  await expect.poll(() => varInline(page, '--glass-blur')).toBe('44px');
});

test('C1 (checklist 1): os 5 pickers existem, rotulados e nos hexes do playground', async ({ page }) => {
  // tema default é dark → fg/bg mostram os valores dark do playground
  const padrao: [string, string, string][] = [
    ['accent', '#2e7d32', 'accent'],
    ['error', '#d32f2f', 'error · --danger'],
    ['warning', '#f9a825', 'warning'],
    ['fg', '#f5f5f7', 'fg · escuro'],
    ['bg', '#0b0b12', 'bg · escuro'],
  ];
  for (const [chave, hex, rotulo] of padrao) {
    const picker = page.getByTestId(`picker-${chave}`);
    await expect(picker).toBeVisible();
    await expect(picker).toHaveValue(hex);
    await expect(page.getByLabel(rotulo, { exact: true })).toBeVisible();
    await expect(page.getByTestId(`hex-${chave}`)).toHaveText(hex);
    await expect(page.getByTestId(`reset-${chave}`)).toBeVisible();
  }
});

test('C2 (checklist 2 e 3): mover accent recalcula os derivados e muda a página inteira', async ({ page }) => {
  await escolherCor(page, 'accent', '#1565c0');

  // playground dark: brand/text = lighten(accent,.42), strong = darken(.12), soft = mix(accent,bg,.86)
  expect(await varInline(page, '--accent')).toBe('#1565c0');
  expect(await varInline(page, '--accent-text')).toBe('#77a6da');
  expect(await varInline(page, '--accent-brand')).toBe('#77a6da');
  expect(await varInline(page, '--accent-strong')).toBe('#1259a9');
  expect(await varInline(page, '--accent-soft')).toBe('#0c182a');
  expect(await varInline(page, '--accent-glass')).toBe('rgba(21, 101, 192, 0.85)');
  expect(await varInline(page, '--on-accent')).toBe('#ffffff');

  // ao vivo, sem reload: o texto do breadcrumb usa var(--accent-text)
  await expect
    .poll(() => page.getByTestId('breadcrumb-secao').evaluate((el) => getComputedStyle(el).color))
    .toBe('rgb(119, 166, 218)');

  // a tabela da seção Colors acompanha a derivação
  await expect(page.locator('[data-contrast-nome="--accent-soft"]')).toContainText('#0C182A');
  await expect(page.locator('[data-contrast-nome="--accent-text"]')).toContainText('#77A6DA');
});

test('C3 (checklist 4): exportar CSS vars inclui os tokens base dos dois temas', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await escolherCor(page, 'accent', '#1565c0');
  await page.getByTestId('botao-exportar-css').click();

  const css = await page.evaluate(() => navigator.clipboard.readText());
  expect(css).toContain(':root {');
  expect(css).toContain('--glass-blur: 44px;');
  expect(css).toContain('--accent: #1565c0;');
  expect(css).toContain('--accent-text: #1259a9;'); // light: darken(accent,.12)
  expect(css).toContain('--accent-text: #77a6da;'); // dark: lighten(accent,.42)
  expect(css).toContain('--danger: #d32f2f;');
  expect(css).toContain('[data-theme=\'dark\'] {');
  expect(css.trim().endsWith('}')).toBe(true);
});

test('C4 (checklist 5): reset por token e reset geral voltam aos defaults', async ({ page }) => {
  await escolherCor(page, 'accent', '#1565c0');
  await page.getByTestId('reset-accent').click();
  expect(await varInline(page, '--accent')).toBe('#2e7d32');
  expect(await varInline(page, '--accent-text')).toBe('#86b488');

  await escolherCor(page, 'bg', '#101018');
  await escolherCor(page, 'warning', '#ff8f00');
  await page.getByTestId('botao-reset').click();
  expect(await varInline(page, '--bg')).toBe('#0b0b12');
  expect(await varInline(page, '--surface')).toBe('#1c1c23');
  expect(await varInline(page, '--warning')).toBe('#f9a825');
  await expect(page.getByTestId('picker-accent')).toHaveValue('#2e7d32');
});

test('C5 (checklist 6): pickers persistem no localStorage através de reload', async ({ page }) => {
  await escolherCor(page, 'accent', '#1565c0');
  await escolherCor(page, 'bg', '#001020');
  await page.reload();

  await expect(page.getByTestId('painel-controle')).toBeVisible();
  await expect(page.getByTestId('picker-accent')).toHaveValue('#1565c0');
  await expect(page.getByTestId('picker-bg')).toHaveValue('#001020');
  await expect.poll(() => varInline(page, '--accent')).toBe('#1565c0');
  // soft recalculado sobre o novo bg: mix(#1565c0, #001020, .86)
  await expect.poll(() => varInline(page, '--accent-soft')).toBe('#031c36');

  const guardado = await page.evaluate(() => localStorage.getItem('vidric.design-system.config'));
  expect(guardado).toContain('"accent":"#1565c0"');
});

test('C6: fg e bg editam o tema ativo sem tocar no outro tema', async ({ page }) => {
  await expect(page.getByTestId('picker-bg')).toHaveValue('#0b0b12');

  await page.getByTestId('switch-tema').click(); // → light
  await expect(page.getByTestId('picker-fg')).toHaveValue('#1d1d1f');
  await expect(page.getByTestId('picker-bg')).toHaveValue('#ffffff');

  await escolherCor(page, 'bg', '#eef4fb');
  expect(await varInline(page, '--bg')).toBe('#eef4fb');
  expect(await varInline(page, '--surface')).toBe('#e7edf3'); // darken(bg,.03)
  expect(await varInline(page, '--muted')).toBe('#606265'); // mix(fg,bg,.32)

  await page.getByTestId('switch-tema').click(); // volta ao dark
  expect(await varInline(page, '--bg')).toBe('#0b0b12');
  expect(await varInline(page, '--surface')).toBe('#1c1c23');
});
