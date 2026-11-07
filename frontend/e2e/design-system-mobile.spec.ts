import { expect, test } from '@playwright/test';
import { SECOES_INDEX } from '../src/app/design-system/_components/indice';

test.beforeEach(async ({ page }) => {
  await page.goto('/design-system');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByTestId('abrir-painel')).toBeVisible();
});

test('M1 (checklist 14): painel vira bottom-sheet em 375px e todas as seções acessíveis', async ({ page }) => {
  await expect(page.getByTestId('painel-desktop')).toHaveCount(0);
  await page.getByTestId('abrir-painel').click();
  const folha = page.getByTestId('painel-folha');
  await expect(folha).toBeVisible();
  await expect(folha.getByTestId('slider-blur')).toBeVisible();
  await expect(folha.getByTestId('switch-tema')).toBeVisible();
  await page.getByRole('button', { name: 'Fechar painel' }).click();
  await expect(folha).toBeHidden();
  for (const s of SECOES_INDEX) {
    await expect(page.getByTestId(s.id)).toBeAttached();
  }
});

test('M2 (checklist 5): modal bottom-sheet do carrinho aparece em 375px', async ({ page }) => {
  await page.getByTestId('secao-modais').scrollIntoViewIfNeeded();
  await page.getByTestId('abrir-modal-folha').click();
  const folha = page.getByTestId('folha-demo');
  await expect(folha).toBeVisible();
  await expect(folha).toContainText('Carrinho');
  await expect(folha).toContainText('87,80');
  await folha.getByRole('button', { name: 'Finalizar venda' }).click();
  await expect(folha).toBeHidden();
  await expect(page.locator('.ds-toaster [data-sonner-toast]').first()).toContainText('Venda finalizada');
});

test('M3: modal de pagamento abre em 375px e fecha no Escape', async ({ page }) => {
  await page.getByTestId('secao-modais').scrollIntoViewIfNeeded();
  await page.getByTestId('abrir-modal-pagamento').click();
  await expect(page.getByTestId('pagamento-total')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('pagamento-total')).toBeHidden();
});

test('M4: toast fica visível e largo (full-width) no mobile', async ({ page }) => {
  await page.getByTestId('secao-toasts').scrollIntoViewIfNeeded();
  await page.getByTestId('toast-sucesso').click();
  const toast = page.locator('.ds-toaster [data-sonner-toast]').first();
  await expect(toast).toBeVisible();
  const caixa = await toast.boundingBox();
  expect(caixa!.width).toBeGreaterThan(300);
});