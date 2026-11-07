import { expect, test, type Page } from '@playwright/test';
import {
  DEMO,
  autenticar,
  entrarNoPdv,
  lerTotal,
  produtoPorBusca,
  toastVisivel,
  type Sessao,
} from './helpers';

const CABO = 'Cabo USB-C Nylon Trancado';
const CAPINHA = 'Capinha iPhone 15 Preta';
const PELICULA = 'Película iPhone 15 Privacidade';

async function adicionarCard(page: Page, produtoId: string, quantidade = 1) {
  const card = page.getByTestId(`card-produto-${produtoId}`);
  await expect(card).toBeVisible();
  for (let i = 0; i < quantidade; i += 1) await card.click();
}

test.describe('Fase 4 — PDV', () => {
  let sessao: Sessao;
  let caboId = '';
  let capinhaId = '';
  let peliculoId = '';

  test.beforeEach(async ({ page, request }) => {
    sessao = await autenticar(request, DEMO);
    caboId = (await produtoPorBusca(request, sessao.token, CABO)).id;
    capinhaId = (await produtoPorBusca(request, sessao.token, CAPINHA)).id;
    peliculoId = (await produtoPorBusca(request, sessao.token, PELICULA)).id;
    await entrarNoPdv(page, sessao);
  });

  test('T12 busca "capinha" devolve resultados em menos de 1s', async ({ page }) => {
    const inicio = Date.now();
    await page.getByTestId('busca-produto').fill('capinha');
    await expect(page.getByTestId(`card-produto-${capinhaId}`)).toBeVisible();
    const decorrido = Date.now() - inicio;

    expect(decorrido).toBeLessThan(1000);
    await expect(page.locator('[data-testid^="card-produto-"]')).toHaveCount(3);
  });

  test('T13 clicar no card adiciona 1 item e atualiza o total', async ({ page }) => {
    expect(await lerTotal(page)).toBe('R$ 0,00');

    await adicionarCard(page, caboId);

    await expect(page.getByTestId(`qtd-Produto:${caboId}`)).toHaveText('1');
    await expect(page.getByText('Cabo USB-C Nylon Trancado', { exact: false }).first()).toBeVisible();
    expect(await lerTotal(page)).toBe('R$ 25,00');
  });

  test('T14 (+) e (−) ajustam quantidade e recalculam o total', async ({ page }) => {
    await adicionarCard(page, caboId);

    await page.getByLabel('Aumentar quantidade de Cabo USB-C Nylon Trancado').click();
    await page.getByLabel('Aumentar quantidade de Cabo USB-C Nylon Trancado').click();
    await expect(page.getByTestId(`qtd-Produto:${caboId}`)).toHaveText('3');
    expect(await lerTotal(page)).toBe('R$ 75,00');

    await page.getByLabel('Diminuir quantidade de Cabo USB-C Nylon Trancado').click();
    await expect(page.getByTestId(`qtd-Produto:${caboId}`)).toHaveText('2');
    expect(await lerTotal(page)).toBe('R$ 50,00');
  });

  test('T15 remover item esvazia o carrinho', async ({ page }) => {
    await adicionarCard(page, caboId);
    await adicionarCard(page, capinhaId);
    expect(await lerTotal(page)).toBe('R$ 70,00');

    await page.getByLabel('Remover Cabo USB-C Nylon Trancado do carrinho').click();
    await expect(page.getByTestId(`qtd-Produto:${caboId}`)).toHaveCount(0);
    expect(await lerTotal(page)).toBe('R$ 45,00');

    await page.getByLabel('Remover Capinha iPhone 15 Preta do carrinho').click();
    await expect(page.getByText('Toque em um produto para adicionar.')).toBeVisible();
    expect(await lerTotal(page)).toBe('R$ 0,00');
    await expect(page.getByTestId('finalizar-venda')).toBeDisabled();
  });

  test('T16 "+ Película c/ Aplicação" lança produto e serviço de R$ 10,00', async ({ page }) => {
    await page.getByTestId('botao-pelicula').click();
    await page.getByTestId(`pelicula-${peliculoId}`).click();

    await expect(page.getByTestId(`qtd-Produto:${peliculoId}`)).toHaveText('1');
    await expect(page.getByTestId('qtd-Servico:Aplicação de película')).toHaveText('1');
    await expect(page.getByText('Aplicação de película')).toBeVisible();
    expect(await lerTotal(page)).toBe('R$ 40,00');
  });

  test('T17 modal de pagamento abre com o total da venda', async ({ page }) => {
    await adicionarCard(page, caboId, 2);
    await page.getByTestId('finalizar-venda').click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByTestId('pagamento-total')).toHaveText('R$ 50,00');
    await expect(page.getByTestId('valor-pago')).toHaveValue('50,00');
    await expect(page.getByTestId('saldo')).toHaveText('Saldo R$ 0,00');
  });

  test('T18 Pix com valor total registra a venda, mostra toast verde e limpa o carrinho', async ({
    page,
    request,
  }) => {
    await adicionarCard(page, caboId);
    await page.getByTestId('finalizar-venda').click();
    await page.getByTestId('confirmar-pagamento').click();

    await toastVisivel(page, 'Venda registrada — R$ 25,00 recebidos', 'success');
    await expect(page.getByTestId('total-carrinho')).toHaveText('R$ 0,00');
    await expect(page.getByText('Toque em um produto para adicionar.')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    const resposta = await request.get(
      `${process.env.E2E_API_URL ?? 'http://localhost:5080'}/api/vendas`,
      { params: { tamanho: 5 }, headers: { Authorization: `Bearer ${sessao.token}` } }
    );
    expect(resposta.ok()).toBeTruthy();
    const lista = await resposta.json();
    const primeira = Array.isArray(lista) ? lista[0] : lista.itens[0];
    expect(primeira.total).toBe(25);
    expect(primeira.status).toBe('Paga');
  });

  test('T19 pagamento parcial cria venda com status Parcial e saldo a receber', async ({
    page,
    request,
  }) => {
    await adicionarCard(page, capinhaId);
    await page.getByTestId('finalizar-venda').click();
    await page.getByTestId('valor-pago').fill('18,00');
    await expect(page.getByTestId('saldo')).toHaveText('Saldo R$ 27,00');

    await page.getByTestId('confirmar-pagamento').click();
    await toastVisivel(page, 'Venda registrada — saldo de R$ 27,00 a receber', 'success');

    const resposta = await request.get(
      `${process.env.E2E_API_URL ?? 'http://localhost:5080'}/api/vendas`,
      {
        params: { status: 'Parcial', tamanho: 5 },
        headers: { Authorization: `Bearer ${sessao.token}` },
      }
    );
    expect(resposta.ok()).toBeTruthy();
    const lista = await resposta.json();
    const itens = Array.isArray(lista) ? lista : lista.itens;
    expect(itens.length).toBeGreaterThan(0);
    expect(itens[0].status).toBe('Parcial');
    expect(itens[0].total).toBe(45);
  });

  test('T20 CPF opcional valida: vazio ok, 11 dígitos ok, "123" bloqueia', async ({ page }) => {
    await adicionarCard(page, caboId);
    await page.getByTestId('finalizar-venda').click();

    await page.getByTestId('cpf-cliente').fill('123');
    await expect(page.getByTestId('erro-cpf')).toBeVisible();
    await expect(page.getByTestId('confirmar-pagamento')).toBeDisabled();

    await page.getByTestId('cpf-cliente').fill('529.982.245-00');
    await expect(page.getByTestId('erro-cpf')).toHaveCount(0);
    await expect(page.getByTestId('cpf-cliente')).toHaveValue('529.982.245-00');
    await expect(page.getByTestId('confirmar-pagamento')).toBeEnabled();

    await page.getByTestId('cpf-cliente').fill('');
    await expect(page.getByTestId('cpf-cliente')).toHaveValue('');
    await expect(page.getByTestId('confirmar-pagamento')).toBeEnabled();

    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('extra: grid do PDV reflete a baixa de estoque após a venda', async ({ page }) => {
    const estoqueAntes = await page
      .getByTestId(`card-produto-${caboId}`)
      .locator('.font-semibold.text-foreground')
      .innerText();

    await adicionarCard(page, caboId);
    await page.getByTestId('finalizar-venda').click();
    await page.getByTestId('confirmar-pagamento').click();
    await toastVisivel(page, 'Venda registrada', 'success');

    await expect
      .poll(() =>
        page
          .getByTestId(`card-produto-${caboId}`)
          .locator('.font-semibold.text-foreground')
          .innerText()
      )
      .toBe(String(Number(estoqueAntes.trim()) - 1));
  });
});
