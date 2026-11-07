import { expect, test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { autenticar, entrarNoPdv, preencherCarrinho, produtoPorBusca, DEMO } from './helpers';

const PASTA = path.resolve(process.cwd(), 'screenshots');

async function salvar(page: import('@playwright/test').Page, nome: string): Promise<void> {
  const destino = path.join(PASTA, nome);
  // O overlay de dev do Next não faz parte da interface do lojista.
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  await page.screenshot({ path: destino, fullPage: true });
  expect(fs.existsSync(destino), `${nome} salvo em frontend/screenshots`).toBeTruthy();
  expect(fs.statSync(destino).size).toBeGreaterThan(5_000);
}

test.describe('T26 + T27 — desktop 1440px', () => {
  test.beforeAll(() => {
    fs.mkdirSync(PASTA, { recursive: true });
  });

  test('PDV em 2 colunas com carrinho sticky, mais as capturas de 1440px', async ({ page, request }) => {
    const sessao = await autenticar(request, DEMO);
    const ids = [
      (await produtoPorBusca(request, sessao.token, 'Cabo USB-C')).id,
      (await produtoPorBusca(request, sessao.token, 'Capinha iPhone 15')).id,
      (await produtoPorBusca(request, sessao.token, 'Fone Bluetooth')).id,
    ];
    const peliculoId = (await produtoPorBusca(request, sessao.token, 'Película iPhone 15 Privacidade')).id;

    await page.goto('/login');
    await expect(page.locator('.glass')).toBeVisible();
    await page.waitForTimeout(700);
    await salvar(page, 'login-1440.png');

    await entrarNoPdv(page, sessao);
    await page.getByTestId('busca-produto').fill('');
    await expect(page.locator('#nav-drawer')).toBeInViewport();
    await salvar(page, 'layout-sidebar-1440.png');

    await preencherCarrinho(page, ids, peliculoId);

    const aside = page.getByTestId('carrinho-lateral');
    await expect(aside).toBeVisible();
    await expect(aside).toHaveCSS('position', 'sticky');
    await expect(aside).toHaveCSS('top', '0px');

    const larguraTela = page.viewportSize()!.width;
    const painel = await page.locator('section').first().boundingBox();
    const caixaCarrinho = await aside.boundingBox();
    expect(painel).not.toBeNull();
    expect(caixaCarrinho).not.toBeNull();
    expect(caixaCarrinho!.x).toBeGreaterThan(painel!.x + painel!.width - 1);
    expect(caixaCarrinho!.x).toBeGreaterThan(800);
    expect(caixaCarrinho!.x + caixaCarrinho!.width).toBeLessThanOrEqual(larguraTela);
    expect(caixaCarrinho!.width).toBeCloseTo(340, 0);

    await expect(page.getByTestId('abrir-carrinho')).not.toBeVisible();
    await salvar(page, 'pdv-carrinho-cheio-1440.png');

    await page.getByTestId('finalizar-venda').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.waitForTimeout(600);
    await salvar(page, 'modal-pagamento-1440.png');
  });
});
