import { expect, test, type Page } from '@playwright/test';
import { SECOES_INDEX } from '../src/app/design-system/_components/indice';

async function abrirPagina(page: Page) {
  await page.goto('/design-system');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByTestId('painel-controle')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--glass-blur')))
    .toBe('44px');
}

async function valorVar(page: Page, nome: string) {
  return page.evaluate((k) => document.documentElement.style.getPropertyValue(k), nome);
}

test.beforeEach(async ({ page }) => {
  await abrirPagina(page);
});

test('D1: título, subtítulo e as 14 seções presentes', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Design System', level: 1 })).toBeVisible();
  await expect(page.getByText('Vidric · ferramenta de dev')).toBeVisible();
  for (const s of SECOES_INDEX) {
    await expect(page.getByTestId(s.id)).toBeAttached();
  }
  await expect(page.getByRole('navigation', { name: 'Seções do design system' }).getByRole('link')).toHaveCount(SECOES_INDEX.length);
});

test('D2 (checklist 6): slider de opacidade altera o vidro ao vivo', async ({ page }) => {
  // O fill vive em camadas de background-image (receita sem pseudos), não em background-color.
  const cor = () =>
    page.getByTestId('secao-cards').evaluate((el) => getComputedStyle(el).backgroundImage);
  const antes = await cor();
  await page.getByTestId('slider-opacidade').getByRole('slider').press('End'); // 0.60
  await expect.poll(cor).not.toBe(antes);
  // dark: gAlpha = 0.60 × 0.22 = 0.132 (fórmula do playground)
  expect(await valorVar(page, '--glass-bg')).toContain('0.132');
});

test('D3 (checklist 7): slider de blur altera o backdrop-filter ao vivo', async ({ page }) => {
  await page.getByTestId('slider-blur').getByRole('slider').press('End'); // 64px
  expect(await valorVar(page, '--glass-blur')).toBe('64px');
  // .glass declara blur(calc(var(--glass-blur) - 12px)) na variante com url()
  await expect
    .poll(() =>
      page.getByTestId('secao-cards').evaluate((el) => getComputedStyle(el).backdropFilter),
    )
    .toContain('52px');
});

test('D4 (checklist 8): slider de border radius altera os cards ao vivo', async ({ page }) => {
  await page.getByTestId('slider-radius').getByRole('slider').press('End'); // 32px
  expect(await valorVar(page, '--radius')).toBe('32px');
  await expect
    .poll(() => page.getByTestId('secao-cards').evaluate((el) => getComputedStyle(el).borderRadius))
    .toBe('32px');
});

test('D5 (checklist 9): toggle light/dark troca sem reload', async ({ page }) => {
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
  await page.getByTestId('switch-tema').click();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('light');
  expect(await valorVar(page, '--glass-bg')).toContain('0.38');
  await page.getByTestId('switch-tema').click();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
});

test('D6 (checklist 10): reload preserva os valores no localStorage', async ({ page }) => {
  await page.getByTestId('slider-blur').getByRole('slider').press('End');
  expect(await valorVar(page, '--glass-blur')).toBe('64px');
  await page.reload();
  await expect(page.getByTestId('painel-controle')).toBeVisible();
  await expect
    .poll(() => valorVar(page, '--glass-blur'))
    .toBe('64px');
  await expect(page.getByTestId('slider-blur').getByRole('slider')).toHaveAttribute('aria-valuenow', '64');
});

test('D7 (checklist 11): Reset volta aos defaults do playground', async ({ page }) => {
  await page.getByTestId('slider-blur').getByRole('slider').press('End');
  await page.getByTestId('slider-radius').getByRole('slider').press('End');
  await page.getByTestId('botao-reset').click();
  expect(await valorVar(page, '--glass-blur')).toBe('44px');
  expect(await valorVar(page, '--radius')).toBe('16px');
  expect(await valorVar(page, '--glass-bg')).toContain('0.0836'); // 0.38 × 0.22 (dark)
  await expect(page.locator('.ds-toaster [data-sonner-toast]').first()).toBeVisible();
});

test('D8 (checklist 12): Exportar CSS vars copia um bloco :root válido', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByTestId('botao-exportar-css').click();
  const css = await page.evaluate(() => navigator.clipboard.readText());
  expect(css).toContain(':root {');
  expect(css).toContain('--glass-blur: 44px;');
  expect(css).toContain('--radius: 16px;');
  expect(css).toContain('--shadow-glass:');
  expect(css.trim().endsWith('}')).toBe(true);
});

test('D9: snapshot salva, aplica e compara configurações', async ({ page }) => {
  await page.getByTestId('input-snapshot').fill('vidro-forte');
  await page.getByTestId('botao-salvar-snapshot').click();
  await expect(page.getByTestId('lista-snapshots')).toContainText('vidro-forte');
  await page.getByTestId('slider-blur').getByRole('slider').press('End');
  expect(await valorVar(page, '--glass-blur')).toBe('64px');
  await page.getByTestId('aplicar-snapshot-vidro-forte').click();
  expect(await valorVar(page, '--glass-blur')).toBe('44px');
  const salvos = await page.evaluate(() => localStorage.getItem('vidric.design-system.snapshots'));
  expect(salvos).toContain('vidro-forte');
});

test('D10 (checklist 4): modal de pagamento é o do PDV — mesmos campos e botões', async ({ page }) => {
  await page.getByTestId('abrir-modal-pagamento').click();
  await expect(page.getByTestId('pagamento-total')).toContainText('87,80');
  await expect(page.getByTestId('valor-pago')).toBeVisible();
  await expect(page.getByTestId('cpf-cliente')).toBeVisible();
  await expect(page.locator('#forma-pagamento')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancelar', exact: true })).toBeVisible();
  await page.getByTestId('valor-pago').fill('50,00');
  await page.getByTestId('valor-pago').blur();
  await expect(page.getByTestId('saldo')).toContainText('37,80');
  await page.getByTestId('confirmar-pagamento').click();
  await expect(page.locator('.ds-toaster [data-sonner-toast]').first()).toContainText('Pagamento confirmado');
  await expect(page.getByTestId('pagamento-total')).toBeHidden();
});

test('D11: modais de confirmação, formulário e destrutivo abrem e fecham no X', async ({ page }) => {
  await page.getByTestId('abrir-modal-confirmacao').click();
  await expect(page.getByRole('heading', { name: 'Desativar produto?' })).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Desativar produto?' })).toBeHidden();

  await page.getByTestId('abrir-modal-formulario').click();
  await page.locator('#ds-modal-nome').fill('Capinha teste');
  await page.locator('#ds-modal-preco').fill('49,90');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.locator('.ds-toaster [data-sonner-toast]').first()).toContainText('cadastrado');

  await page.getByTestId('abrir-modal-destrutivo').click();
  await expect(page.getByRole('dialog').getByText('Esta ação não pode ser desfeita.')).toBeVisible();
  await page.getByTestId('confirmar-exclusao').click();
  await expect(page.getByRole('heading', { name: 'Excluir produto?' })).toBeHidden();
});

test('D12: toasts disparam e só o Toaster da página fica visível', async ({ page }) => {
  await page.getByTestId('toast-sucesso').click();
  await expect(page.locator('.ds-toaster [data-sonner-toast]').first()).toContainText('Produto cadastrado');
  // O ol do sonner tem altura 0 (li's absolutos), então :visible não serve aqui:
  // o toaster do app é display:none via PAGE_CSS e o da página renderiza o toast acima.
  await expect(page.locator('[data-sonner-toaster]')).toHaveCount(2);
  await expect(page.locator('[data-sonner-toaster]:not(.ds-toaster)')).toBeHidden();
  await page.getByTestId('toast-erro').click();
  await expect(page.locator('.ds-toaster [data-sonner-toast][data-type="error"]').first()).toBeVisible();
  await page.getByTestId('toast-manual').click();
  const manual = page.locator('.ds-toaster [data-sonner-toast]').filter({ hasText: 'Conexão instável' });
  await expect(manual).toBeVisible();
  await expect(manual.getByRole('button', { name: 'Close toast' })).toBeVisible();
});

test('D13: dropdowns de avatar e ações contextuais', async ({ page }) => {
  await page.getByTestId('ds-avatar').click();
  await expect(page.getByText('Ana Souza')).toBeVisible();
  await expect(page.getByText('demo@vidric.app')).toBeVisible();
  await expect(page.getByTestId('ds-menu-sair')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByTestId('ds-acoes').click();
  await expect(page.getByRole('menuitem', { name: 'Editar' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Duplicar' })).toBeVisible();
  await page.getByRole('menuitem', { name: 'Excluir' }).click();
  await expect(page.locator('.ds-toaster [data-sonner-toast]').first()).toContainText('Excluído');
});

test('D14: toggle de code blocks oculta/mostra os exemplos de código', async ({ page }) => {
  const bloco = page.locator('.ds-code').first();
  await expect(bloco).toBeVisible();
  await page.getByTestId('switch-code').click();
  await expect(bloco).toBeHidden();
  await page.getByTestId('switch-code').click();
  await expect(bloco).toBeVisible();
});

test('D15: select custom abre e seleciona', async ({ page }) => {
  await page.locator('#ds-select-custom').click();
  await page.getByRole('option', { name: 'Capinhas' }).click();
  await expect(page.locator('#ds-select-custom')).toContainText('Capinhas');
});