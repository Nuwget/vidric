import { expect, test, type Page } from '@playwright/test';
import { API_URL, DEMO, autenticar, entrar, entrarNoPdv, produtoPorBusca, type Sessao } from './helpers';

const CABO = 'Cabo USB-C Nylon Trancado';

async function adicionarCaboEPagar(page: Page, caboId: string, forma?: 'Dinheiro') {
  await page.getByTestId(`card-produto-${caboId}`).click();
  await page.getByTestId('finalizar-venda').click();
  if (forma) {
    await page.getByLabel('Forma').click();
    await page.getByRole('option', { name: forma, exact: true }).click();
  }
}

test.describe('Fase 4 — o frontend respeita as regras do backend', () => {
  let sessao: Sessao;
  let caboId = '';

  test.beforeEach(async ({ page, request }) => {
    sessao = await autenticar(request, DEMO);
    caboId = (await produtoPorBusca(request, sessao.token, CABO)).id;
    await entrarNoPdv(page, sessao);
  });

  test('T21 venda em Dinheiro sem caixa aberto devolve a mensagem exata do backend', async ({
    page,
    request,
  }) => {
    const caixa = await request.get(`${API_URL}/api/caixa/atual`, {
      headers: { Authorization: `Bearer ${sessao.token}` },
    });
    expect(caixa.status()).toBe(404);

    const antes = await request.get(`${API_URL}/api/produtos/${caboId}`, {
      headers: { Authorization: `Bearer ${sessao.token}` },
    });
    const estoqueAntes = (await antes.json()).qtdEstoque as number;

    await adicionarCaboEPagar(page, caboId, 'Dinheiro');

    const resposta = page.waitForResponse(
      (r) => r.url().includes('/api/vendas') && r.request().method() === 'POST',
      { timeout: 20_000 }
    );
    await page.getByTestId('confirmar-pagamento').click();
    const { status, corpo } = await resposta.then(async (r) => ({
      status: r.status(),
      corpo: await r.json(),
    }));

    expect(status).toBe(400);
    expect(corpo.erro).toBe('Abra o caixa antes de vender em dinheiro.');

    // Fecha o modal: enquanto aberto, o Radix esconde o resto da árvore de acessibilidade.
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await expect(
      page.locator('[data-sonner-toast][data-type="error"]').filter({ hasText: corpo.erro }).first()
    ).toBeVisible();

    await expect(page.getByTestId('total-carrinho')).toHaveText('R$ 25,00');
    await expect(page.getByRole('status')).toContainText('Caixa fechado');
    await expect(page.getByRole('status')).toHaveCSS('border-color', /rgb\(249, 168, 37\)/);

    const vendas = await request.get(`${API_URL}/api/produtos/${caboId}`, {
      headers: { Authorization: `Bearer ${sessao.token}` },
    });
    expect((await vendas.json()).qtdEstoque).toBe(estoqueAntes);
  });

  test('T22 concorrência: duas abas disputando a última unidade — uma 201, outra 409', async ({
    browser,
    request,
  }) => {
    sessao = await autenticar(request, DEMO);
    const nomeCorrida = `Corrida ${Date.now()}`;

    const criacao = await request.post(`${API_URL}/api/produtos`, {
      headers: { Authorization: `Bearer ${sessao.token}` },
      data: {
        nome: nomeCorrida,
        precoVenda: 19,
        custo: 8,
        qtdEstoque: 1,
        estoqueMinimo: 0,
        categoria: 'Acessório',
        modelo: 'última unidade',
        cor: 'Branco',
      },
    });
    expect(criacao.status()).toBe(201);
    const produto = await criacao.json();

    const contexto = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const [abaA, abaB] = await Promise.all([contexto.newPage(), contexto.newPage()]);

    try {
      for (const aba of [abaA, abaB]) {
        await entrar(aba, sessao, '/pdv');
        await aba.getByTestId('busca-produto').fill(nomeCorrida);
        await aba.getByTestId(`card-produto-${produto.id}`).click();
        await aba.getByTestId('finalizar-venda').click();
        await expect(aba.getByTestId('pagamento-total')).toHaveText('R$ 19,00');
      }

      const esperaA = abaA.waitForResponse(
        (r) => r.url().includes('/api/vendas') && r.request().method() === 'POST',
        { timeout: 20_000 }
      );
      const esperaB = abaB.waitForResponse(
        (r) => r.url().includes('/api/vendas') && r.request().method() === 'POST',
        { timeout: 20_000 }
      );

      await Promise.all([
        abaA.getByTestId('confirmar-pagamento').click(),
        abaB.getByTestId('confirmar-pagamento').click(),
      ]);

      const [respostaA, respostaB] = await Promise.all([esperaA, esperaB]);
      const codigos = [respostaA.status(), respostaB.status()].sort();
      expect(codigos).toEqual([201, 409]);

      const vencedora = respostaA.status() === 201 ? abaA : abaB;
      const perdedora = respostaA.status() === 201 ? abaB : abaA;

      await expect(
        vencedora.locator('[data-sonner-toast][data-type="success"]').filter({ hasText: 'Venda registrada' }).first()
      ).toBeVisible();
      await expect(vencedora.getByTestId('total-carrinho')).toHaveText('R$ 0,00');

      await expect(
        perdedora
          .locator('[data-sonner-toast][data-type="error"]')
          .filter({ hasText: 'Outro operador finalizou a última unidade. Atualize a busca.' })
          .first()
      ).toBeVisible();

      const estoque = await produtoPorBusca(request, sessao.token, nomeCorrida);
      expect(estoque.qtdEstoque).toBe(0);
    } finally {
      await request.patch(`${API_URL}/api/produtos/${produto.id}/ativo`, {
        headers: { Authorization: `Bearer ${sessao.token}` },
      });
      await contexto.close();
    }
  });
});
