import { expect, test } from '@playwright/test';
import { DEMO, autenticar, entrar, produtoPorBusca, type Sessao } from './helpers';

test.describe('Fase 5a — Estoque mobile 375px', () => {
  let sessao: Sessao;

  test.beforeEach(async ({ request }) => {
    sessao = await autenticar(request, DEMO);
  });

  test('C20 tabela vira cards, ações em dropdown e "+ Novo" visível', async ({ page, request }) => {
    const cabo = await produtoPorBusca(request, sessao.token, 'Cabo USB-C');
    await entrar(page, sessao, '/estoque');

    await expect(page.getByTestId('tabela-estoque')).not.toBeVisible();
    await expect(page.getByTestId('cards-estoque')).toBeVisible();
    const card = page.getByTestId(`card-estoque-${cabo.id}`);
    await expect(card).toBeVisible();
    await expect(page.getByTestId('botao-novo-produto')).toBeVisible();

    await card.getByTestId(`acoes-produto-${cabo.id}`).click();
    await expect(page.getByRole('menuitem', { name: 'Ver detalhe' })).toBeVisible();
    await page.keyboard.press('Escape');

    await card.locator('button').first().click();
    await expect(page).toHaveURL(new RegExp(`/estoque/${cabo.id}`));
    await expect(page.getByTestId('estoque-atual')).toBeVisible();
    await expect(page.getByTestId('botao-entrada')).toBeVisible();
    await expect(page.getByTestId('cards-movimentos')).toBeVisible();
  });
});