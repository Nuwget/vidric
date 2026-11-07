import { expect, test } from '@playwright/test';
import { DEMO, autenticar, entrar, entrarNoPdv, esperarPdvPronto } from './helpers';

test.describe('Fase 4 — layout base', () => {
  test('T9 header mostra nome da loja e nome do usuário', async ({ page, request }) => {
    const sessao = await autenticar(request, DEMO);
    await entrar(page, sessao, '/pdv');
    await esperarPdvPronto(page);

    const header = page.locator('header').first();
    await expect(header).toContainText(DEMO.loja);
    await expect(header).toContainText(DEMO.nome);
  });

  test('T10 sidebar some em mobile e fica fixa em desktop', async ({ page, request }) => {
    const sessao = await autenticar(request, DEMO);
    await entrar(page, sessao, '/pdv');
    await esperarPdvPronto(page);

    const drawer = page.locator('#nav-drawer');
    await expect(drawer).toBeInViewport();

    await page.setViewportSize({ width: 375, height: 812 });
    await expect
      .poll(async () => {
        const caixa = await drawer.boundingBox();
        return caixa ? caixa.x + caixa.width : null;
      }, { timeout: 10_000 })
      .toBeLessThanOrEqual(1);

    await page.getByLabel('Abrir menu').click();
    await expect
      .poll(async () => {
        const caixa = await drawer.boundingBox();
        return caixa ? caixa.x : null;
      }, { timeout: 10_000 })
      .toBeGreaterThanOrEqual(-1);

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(drawer).toHaveCSS('position', 'static');
    await expect(drawer).toBeInViewport();
  });

  test('T11 banner "Caixa fechado" aparece quando /api/caixa/atual responde 404', async ({
    page,
    request,
  }) => {
    const caixa = await request.get(`${process.env.E2E_API_URL ?? 'http://localhost:5080'}/api/caixa/atual`, {
      headers: { Authorization: `Bearer ${(await autenticar(request, DEMO)).token}` },
    });
    expect(caixa.status()).toBe(404);

    const sessao = await autenticar(request, DEMO);
    await entrarNoPdv(page, sessao);

    await expect(page.getByRole('status')).toContainText(
      'Caixa fechado. Abra o caixa para vender em dinheiro.'
    );
  });

  test('extra: SuperAdmin não vê banner de caixa nem nome de loja', async ({ page, request }) => {
    const sessao = await autenticar(request, { email: DEMO.email, senha: DEMO.senha });
    await entrar(page, { ...sessao, papel: 'SuperAdmin', lojaId: null }, '/admin');

    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Painel Super Admin' })).toBeVisible();
  });
});
