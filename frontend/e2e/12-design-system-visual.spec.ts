import { expect, test, type Page } from '@playwright/test';

/* Capturas de aceite da /design-system: 3 vistas × 2 temas × 2 viewports = 12.
   O tema é sempre trocado clicando no switch-tema (aplicarConfig recalcula as
   glass vars); setar data-theme direto deixaria vars inline do outro tema. */

async function definirTema(page: Page, tema: 'light' | 'dark', largura: number): Promise<void> {
  const atual = await page.evaluate(() => document.documentElement.dataset.theme);
  if (atual !== tema) {
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
  }
  await page.waitForTimeout(350);
}

async function capturar(page: Page, nome: string, fullPage = false): Promise<void> {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `screenshots/${nome}.png`, fullPage });
}

test('capturas de aceite do design system (3 vistas × 2 temas × 2 viewports)', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/design-system');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByTestId('painel-desktop')).toBeVisible();
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  await page.waitForTimeout(900);

  for (const largura of [1440, 375]) {
    await page.setViewportSize({ width: largura, height: largura === 1440 ? 900 : 812 });
    await page.waitForTimeout(400);

    for (const tema of ['light', 'dark'] as const) {
      await definirTema(page, tema, largura);

      // Página completa
      await page.evaluate(() => window.scrollTo(0, 0));
      await capturar(page, `design-system-pagina-${tema}-${largura}`, true);

      // Seção de modais com o modal de pagamento (componente real do PDV) aberto
      await page.getByTestId('secao-modais').scrollIntoViewIfNeeded();
      await page.getByTestId('abrir-modal-pagamento').click();
      await expect(page.getByTestId('pagamento-total')).toBeVisible();
      await capturar(page, `design-system-modais-${tema}-${largura}`);
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('pagamento-total')).toBeHidden();

      // Painel de controle (fixo no desktop; bottom-sheet aberto no mobile)
      await page.evaluate(() => window.scrollTo(0, 0));
      if (largura === 375) {
        await page.getByTestId('abrir-painel').click();
        await expect(page.getByTestId('painel-folha')).toBeVisible();
        await capturar(page, `design-system-painel-${tema}-${largura}`);
        await page.getByRole('button', { name: 'Fechar painel' }).click();
        await expect(page.getByTestId('painel-folha')).toBeHidden();
      } else {
        await capturar(page, `design-system-painel-${tema}-${largura}`);
      }
    }
  }
});