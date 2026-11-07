import { expect, test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { autenticar, entrarNoPdv, preencherCarrinho, produtoPorBusca, DEMO } from './helpers';

const PASTA = path.resolve(process.cwd(), 'screenshots');

async function salvar(page: import('@playwright/test').Page, nome: string): Promise<void> {
  const destino = path.join(PASTA, nome);
  // O overlay de dev do Next não faz parte da interface do lojista.
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  await page.screenshot({ path: destino, fullPage: false });
  expect(fs.existsSync(destino), `${nome} salvo em frontend/screenshots`).toBeTruthy();
  expect(fs.statSync(destino).size).toBeGreaterThan(5_000);
}

async function alturaMinima(page: import('@playwright/test').Page, alvo: string, minimo = 48): Promise<void> {
  const el = page.locator(alvo).first();
  await expect(el).toBeVisible({ timeout: 10_000 });
  const caixa = await el.boundingBox();
  expect(caixa, `${alvo} visível`).not.toBeNull();
  expect(Math.round(caixa!.height), `altura tátil de ${alvo}`).toBeGreaterThanOrEqual(minimo);
}

test.describe('T25 + T27 — mobile 375px', () => {
  test.beforeAll(() => {
    fs.mkdirSync(PASTA, { recursive: true });
  });

  test('login em 375px', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('.glass')).toBeVisible();
    await page.waitForTimeout(700);
    await alturaMinima(page, 'button[type="submit"]');
    await alturaMinima(page, '#email');
    expect(Math.round((await page.locator('.glass').boundingBox())!.width)).toBeLessThanOrEqual(375);
    await salvar(page, 'login-375.png');
  });

  test('PDV usável, alvos táteis de 48px+ e carrinho em folha', async ({ page, request }) => {
    const sessao = await autenticar(request, DEMO);
    const ids = [
      (await produtoPorBusca(request, sessao.token, 'Cabo USB-C')).id,
      (await produtoPorBusca(request, sessao.token, 'Capinha iPhone 15')).id,
      (await produtoPorBusca(request, sessao.token, 'Carregador Veicular')).id,
    ];
    const peliculoId = (await produtoPorBusca(request, sessao.token, 'Película iPhone 15 Privacidade')).id;
    await entrarNoPdv(page, sessao);

    // Sidebar fora da tela; abre pelo menu hambúrguer.
    const drawer = page.locator('#nav-drawer');
    const caixaFechada = await drawer.boundingBox();
    expect(caixaFechada === null || caixaFechada.x + caixaFechada.width <= 1).toBeTruthy();

    await page.getByLabel('Abrir menu').click();
    await expect
      .poll(async () => (await drawer.boundingBox())?.x ?? null, { timeout: 10_000 })
      .toBeGreaterThanOrEqual(-1);
    await salvar(page, 'layout-sidebar-375.png');

    await page.getByLabel('Fechar menu').click();
    await expect
      .poll(async () => {
        const caixa = await drawer.boundingBox();
        return caixa ? caixa.x + caixa.width : 0;
      }, { timeout: 10_000 })
      .toBeLessThanOrEqual(1);

    await preencherCarrinho(page, ids, peliculoId);

    // Página em 1 coluna (carrinho sai da lateral e vira folha); o grid de cards
    // continua 2 colunas em qualquer largura, igual ao playground aprovado.
    await expect(page.getByTestId('carrinho-lateral')).not.toBeVisible();
    await expect(page.getByTestId('abrir-carrinho')).toBeVisible();
    const cabecalhos = await page.locator('[data-testid^="card-produto-"]').all();
    if (cabecalhos.length > 1) {
      await page.waitForTimeout(600);
      const primeiro = await cabecalhos[0].boundingBox();
      const segundo = await cabecalhos[1].boundingBox();
      expect(Math.abs(segundo!.y - primeiro!.y), 'cards lado a lado').toBeLessThan(30);
      expect(segundo!.x).toBeGreaterThan(primeiro!.x);
      expect(primeiro!.width).toBeLessThanOrEqual(375 / 2);
    }

    await alturaMinima(page, '[data-testid="botao-pelicula"]');
    await alturaMinima(page, '[data-testid="busca-produto"]');
    await alturaMinima(page, '[data-testid="abrir-carrinho"]');
    await alturaMinima(page, 'button[aria-label="Abrir menu"]');
    await alturaMinima(page, 'header button[aria-label="Menu do usuário"]');

    await page.getByTestId('abrir-carrinho').click();
    const folha = page.locator('#carrinho-folha');
    await expect(folha).toBeVisible();
    // A folha entra animada (spring de baixo); espera assentar antes de medir.
    await expect
      .poll(async () =>
        folha.evaluate((el) => Math.abs(el.getBoundingClientRect().bottom - window.innerHeight))
      )
      .toBeLessThan(2);

    const medicao = await folha.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { height: r.height, width: r.width, viewport: window.innerHeight };
    });
    expect(medicao.width).toBeCloseTo(375, 0);
    expect(medicao.height).toBeLessThanOrEqual(medicao.viewport);

    await alturaMinima(page, '#carrinho-folha button[aria-label^="Aumentar quantidade"]');
    await alturaMinima(page, '#carrinho-folha button[aria-label^="Diminuir quantidade"]');
    await alturaMinima(page, '#carrinho-folha button[aria-label^="Remover"]');
    await alturaMinima(page, '#carrinho-folha [data-testid="finalizar-venda"]');
    await salvar(page, 'pdv-carrinho-cheio-375.png');

    await page.locator('#carrinho-folha [data-testid="finalizar-venda"]').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.waitForTimeout(700);
    await alturaMinima(page, '[data-testid="confirmar-pagamento"]');
    await salvar(page, 'modal-pagamento-375.png');
  });
});
