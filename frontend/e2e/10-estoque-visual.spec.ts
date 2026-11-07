import { expect, test, type Page } from '@playwright/test';
import { DEMO, autenticar, entrar, produtoPorBusca } from './helpers';

async function capturar(page: Page, nome: string, tema: 'light' | 'dark'): Promise<void> {
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
  }, tema);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `screenshots/${nome}.png`, fullPage: false });
}

test('capturas de aceite do estoque (4 telas × 2 temas × 2 viewports)', async ({ page, request }) => {
  const sessao = await autenticar(request, DEMO);
  const cabo = await produtoPorBusca(request, sessao.token, 'Cabo USB-C');

  for (const { largura, altura } of [
    { largura: 1440, altura: 900 },
    { largura: 375, altura: 812 },
  ]) {
    await page.setViewportSize({ width: largura, height: altura });

    await entrar(page, sessao, '/estoque');
    const itemLista = largura === 375 ? '[data-testid^="card-estoque-"]' : '[data-testid^="linha-produto-"]';
    await expect(page.locator(itemLista).first()).toBeVisible();
    await page.waitForTimeout(500);
    await capturar(page, `estoque-lista-light-${largura}`, 'light');
    await capturar(page, `estoque-lista-dark-${largura}`, 'dark');

    await entrar(page, sessao, '/estoque/novo');
    await expect(page.getByTestId('campo-nome')).toBeVisible();
    await page.getByTestId('botao-mais-opcoes').click();
    await page.waitForTimeout(300);
    await capturar(page, `estoque-novo-light-${largura}`, 'light');
    await capturar(page, `estoque-novo-dark-${largura}`, 'dark');

    await entrar(page, sessao, `/estoque/${cabo.id}`);
    await expect(page.getByTestId('estoque-atual')).toBeVisible();
    await page.waitForTimeout(300);
    await capturar(page, `estoque-detalhe-light-${largura}`, 'light');
    await capturar(page, `estoque-detalhe-dark-${largura}`, 'dark');

    await entrar(page, sessao, '/estoque/relatorios/parados');
    await expect(page.getByTestId('valor-imobilizado')).toContainText('R$');
    await page.waitForTimeout(300);
    await capturar(page, `estoque-parados-light-${largura}`, 'light');
    await capturar(page, `estoque-parados-dark-${largura}`, 'dark');
  }
});