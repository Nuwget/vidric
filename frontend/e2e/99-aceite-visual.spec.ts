import { expect, test, type Page } from '@playwright/test';
import { DEMO, autenticar, entrar, esperarPdvPronto, preencherCarrinho, produtoPorBusca } from './helpers';

async function capturar(page: Page, nome: string, tema: 'light' | 'dark'): Promise<void> {
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
  }, tema);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `screenshots/${nome}.png`, fullPage: false });
}

test('capturas de aceite do liquid glass no PDV', async ({ page, request }) => {
  const sessao = await autenticar(request, DEMO);
  await entrar(page, sessao, '/pdv');
  await esperarPdvPronto(page);

  const capinha = await produtoPorBusca(request, sessao.token, 'capinha');
  const pelicula = await produtoPorBusca(request, sessao.token, 'película');
  await preencherCarrinho(page, [capinha.id], pelicula.id);

  for (const viewport of [
    { largura: 1440, altura: 900 },
    { largura: 375, altura: 812 },
  ]) {
    const mobile = viewport.largura === 375;
    await page.setViewportSize({ width: viewport.largura, height: viewport.altura });
    await page.waitForTimeout(600);
    const filtro = await page
      .locator('section.glass')
      .first()
      .evaluate((el) => getComputedStyle(el).backdropFilter);
    expect(filtro).toContain('url("#liquid-glass")');

    if (mobile) {
      // no mobile o carrinho vive na bottom sheet — captura o PDV limpo e
      // abre a folha só para disparar o modal ("Finalizar" só existe lá)
      await capturar(page, `pdv-vidro-light-${viewport.largura}`, 'light');
      await page.getByTestId('abrir-carrinho').click();
      await expect(page.locator('#carrinho-folha').getByTestId('total-carrinho')).toBeVisible();
    } else {
      await capturar(page, `pdv-vidro-light-${viewport.largura}`, 'light');
    }

    // modal de pagamento flutuando sobre o vidro
    const painelCarrinho = mobile ? page.locator('#carrinho-folha') : page.getByTestId('carrinho-lateral');
    await painelCarrinho.getByTestId('finalizar-venda').click();
    await expect(page.getByTestId('pagamento-total')).toBeVisible();
    await capturar(page, `modal-vidro-light-${viewport.largura}`, 'light');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('pagamento-total')).toBeHidden();
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(600);
  await capturar(page, 'pdv-vidro-dark-1440', 'dark');

  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(600);
  await capturar(page, 'pdv-vidro-dark-375', 'dark');

  // carrinho em bottom sheet sobre o vidro escuro
  await page.getByTestId('abrir-carrinho').click();
  await expect(page.locator('#carrinho-folha').getByTestId('total-carrinho')).toBeVisible();
  await capturar(page, 'carrinho-vidro-dark-375', 'dark');
});
