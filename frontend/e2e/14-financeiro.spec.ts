import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'node:fs';
import * as path from 'node:path';
// node:sqlite existe no Node 24 do ambiente, mas @types/node 20 não o tipa.
// @ts-expect-error módulo nativo sem tipos em @types/node@20
import { DatabaseSync } from 'node:sqlite';
import { API_URL, DEMO, autenticar, entrar, toastVisivel, type Sessao } from './helpers';

/* Fase 5b — Financeiro. O coração é vendido ≠ recebido por design:
   C2/C3 comprovam a separação competência × caixa com uma loja nova
   (números exatos), C12 bloqueia dinheiro sem caixa, C16 isola lojas,
   C19 roda axe nos 4 combos. Cada teste cria a própria loja (emails
   únicos) para números exatos e isolamento entre testes. */

const RUN = Date.now();
const DB_PATH = path.resolve(__dirname, '..', '..', 'src', 'LojaGaleria.API', 'lojagaleria.db');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];

let contadorLojas = 0;

interface Loja {
  sessao: Sessao;
  produtoId: string;
}

interface Venda {
  id: string;
  total: number;
  status: string;
  saldo: number;
}

async function criarLoja(request: APIRequestContext): Promise<Loja> {
  contadorLojas += 1;
  const email = `e2e-fin-${RUN}-${contadorLojas}@vidric.app`;
  const registro = await request.post(`${API_URL}/api/auth/registrar-loja`, {
    data: {
      nomeLoja: `Galeria Fin E2E ${RUN} ${contadorLojas}`,
      nomeAdmin: 'Carla Teste',
      emailAdmin: email,
      senhaAdmin: 'Senha@123',
    },
  });
  expect(registro.status(), `registrar loja: ${await registro.text()}`).toBe(201);
  const sessao = await autenticar(request, { email, senha: 'Senha@123' });

  const produto = await request.post(`${API_URL}/api/produtos`, {
    headers: { Authorization: `Bearer ${sessao.token}` },
    data: { nome: `E2E Fin Produto ${RUN} ${contadorLojas}`, precoVenda: 100, qtdEstoque: 10, estoqueMinimo: 1 },
  });
  expect(produto.status(), `criar produto: ${await produto.text()}`).toBe(201);
  return { sessao, produtoId: (await produto.json()).id };
}

async function criarVendaApi(
  request: APIRequestContext,
  token: string,
  corpo: Record<string, unknown>
): Promise<Venda> {
  const resposta = await request.post(`${API_URL}/api/vendas`, {
    headers: { Authorization: `Bearer ${token}` },
    data: corpo,
  });
  expect(resposta.status(), `criar venda: ${await resposta.text()}`).toBe(201);
  return resposta.json();
}

/** Venda de 100 com 60 pagos no Pix → Parcial, saldo 40 (fiado). */
async function vendaParcial(loja: Loja, request: APIRequestContext, cpf: string): Promise<Venda> {
  const venda = await criarVendaApi(request, loja.sessao.token, {
    cpfCliente: cpf,
    itens: [{ tipo: 'Produto', produtoId: loja.produtoId, quantidade: 1, precoUnitario: 100 }],
    pagamentos: [{ forma: 'Pix', valor: 60 }],
  });
  expect(venda).toMatchObject({ total: 100, status: 'Parcial', saldo: 40 });
  return venda;
}

/** Venda de 100 sem pagamento nenhum → Pendente, saldo 100 (fiado total). */
async function vendaPendente(loja: Loja, request: APIRequestContext, cpf: string): Promise<Venda> {
  const venda = await criarVendaApi(request, loja.sessao.token, {
    cpfCliente: cpf,
    itens: [{ tipo: 'Produto', produtoId: loja.produtoId, quantidade: 1, precoUnitario: 100 }],
    pagamentos: [],
  });
  expect(venda).toMatchObject({ status: 'Pendente', saldo: 100 });
  return venda;
}

/** DataHora em formato SQLite "yyyy-MM-dd HH:mm:ss.fffffff" (o EF grava UtcNow sem Z). */
function dataSQLite(d: Date): string {
  const pad = (n: number, l = 2) => String(n).padStart(l, '0');
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.0000000`
  );
}

/** C3: a venda e o pagamento de 60 voltam para ontem; o pagamento de 40 fica hoje. */
function voltarUmDia(idVenda: string): void {
  const ontem = dataSQLite(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const db = new DatabaseSync(DB_PATH);
  try {
    db.prepare('UPDATE Vendas SET DataHora = ? WHERE Id = ?').run(ontem, idVenda.toUpperCase());
    db.prepare('UPDATE Pagamentos SET DataHora = ? WHERE VendaId = ?').run(ontem, idVenda.toUpperCase());
  } finally {
    db.close();
  }
}

async function abrirFinanceiro(page: Page, sessao: Sessao, rota = '/financeiro'): Promise<void> {
  await entrar(page, sessao, rota);
  const marcador = rota.endsWith('/a-receber')
    ? 'a-receber-total'
    : rota.endsWith('/fluxo-caixa')
      ? 'filtro-tipo-movimento'
      : 'financeiro-tres-numeros';
  await expect(page.getByTestId(marcador)).toBeVisible({ timeout: 20_000 });
}

async function definirTema(page: Page, tema: 'light' | 'dark'): Promise<void> {
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
  }, tema);
  await expect(page.locator('html')).toHaveAttribute('data-theme', tema);
  await page.waitForTimeout(400);
}

async function receberFiado(page: Page, vendaId: string, valor: string, forma?: string): Promise<void> {
  await page.getByTestId(`botao-receber-${vendaId}`).click();
  await expect(page.getByTestId('modal-receber-fiado')).toBeVisible();
  await page.getByTestId('input-valor-pagamento').fill(valor);
  if (forma) {
    await page.getByTestId('select-forma-pagamento').click();
    await page.getByRole('option', { name: forma }).click();
  }
  await page.getByTestId('botao-confirmar-pagamento').click();
}

test.describe('Fase 5b — Financeiro', () => {
  test('C2 (crítico) venda 100/pago 60 → Vendido 100, Recebido 60, Em aberto 40', async ({
    page,
    request,
  }) => {
    const loja = await criarLoja(request);
    const parcial = await vendaParcial(loja, request, '11122233344');

    await abrirFinanceiro(page, loja.sessao, '/financeiro');
    await expect(page.getByTestId('nota-vendido-recebido')).toContainText('Vendido ≠ Recebido por design');

    await expect(page.getByTestId('card-vendido')).toContainText('100,00');
    await expect(page.getByTestId('card-recebido')).toContainText('60,00');
    await expect(page.getByTestId('card-em-aberto')).toContainText('40,00');
    await expect(page.getByTestId('card-vendido')).toContainText('Faturamento no período (inclui fiado não pago)');
    await expect(page.getByTestId('card-recebido')).toContainText('Entrou no caixa/período (inclui fiado antigo pago agora)');
    await expect(page.getByTestId('card-em-aberto')).toContainText('Total fiado a receber (acumulado, não filtrado pelo período)');

    // Gráficos: linha dupla + rosca com Pix 100%.
    await expect(page.getByTestId('grafico-vendas-por-dia')).toBeVisible();
    await expect(page.getByTestId('grafico-recebido-por-forma')).toBeVisible();
    await expect(page.getByTestId('forma-pix')).toContainText('60,00');
    await expect(page.getByTestId('forma-pix')).toContainText('100%');
    for (const forma of ['forma-dinheiro', 'forma-cartaoDebito', 'forma-cartaoCredito', 'forma-outro']) {
      await expect(page.getByTestId(forma)).toContainText('R$ 0,00');
    }

    // Sidebar destravada com submenu (desktop).
    await expect(page.locator('#nav-drawer').getByText('Financeiro')).toBeVisible();
    await expect(page.getByTestId('submenu-a-receber')).toBeVisible();
    await expect(page.getByTestId('submenu-fluxo-de-caixa')).toBeVisible();

    // Card em aberto leva para /a-receber.
    await page.getByTestId('card-em-aberto').getByRole('link').click();
    await expect(page).toHaveURL(/\/financeiro\/a-receber/);
    await expect(page.getByTestId('a-receber-total')).toContainText('40,00');
    await expect(page.getByTestId('a-receber-total')).toContainText('1 venda fiado em aberto');

    const linha = page.getByTestId(`linha-a-receber-${parcial.id}`);
    await expect(linha).toBeVisible();
    await expect(linha).toContainText('111.222.333-44');
    await expect(linha).toContainText('R$ 100,00');
    await expect(linha).toContainText('R$ 60,00');
    await expect(linha).toContainText('Parcial');
  });

  test('C3 (crítico) pagar o fiado no dia seguinte → Vendido 0, Recebido 40, Em aberto 0', async ({
    page,
    request,
  }) => {
    const loja = await criarLoja(request);
    const parcial = await vendaParcial(loja, request, '11122233344');

    // A venda e o pagamento de 60 voltam para ontem; o pagamento de 40 é hoje.
    voltarUmDia(parcial.id);

    await abrirFinanceiro(page, loja.sessao, '/financeiro');
    await page.getByTestId('periodo-hoje').click();
    await expect(page.getByTestId('periodo-hoje')).toHaveAttribute('aria-pressed', 'true');

    await expect(page.getByTestId('card-vendido')).toContainText('R$ 0,00');
    await expect(page.getByTestId('card-recebido')).toContainText('R$ 0,00');
    await expect(page.getByTestId('card-em-aberto')).toContainText('40,00');

    // Receber o fiado pelo modal (Pix, valor sugerido = saldo).
    await page.getByTestId('submenu-a-receber').click();
    await expect(page).toHaveURL(/\/financeiro\/a-receber/);
    await page.getByTestId('busca-cpf').fill('11122233344');
    await expect(page.getByTestId(`linha-a-receber-${parcial.id}`)).toBeVisible();

    await receberFiado(page, parcial.id, '40,00');
    await toastVisivel(page, 'Pagamento de R$ 40,00 registrado.', 'success');
    await expect(page.getByTestId('modal-receber-fiado')).toHaveCount(0);

    // De volta ao dashboard (período Hoje persistido): só o recebido de hoje entra.
    await page.getByTestId('submenu-dashboard').click();
    await expect(page).toHaveURL(/\/financeiro$/);
    await expect(page.getByTestId('periodo-hoje')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('card-vendido')).toContainText('R$ 0,00');
    await expect(page.getByTestId('card-recebido')).toContainText('40,00');
    await expect(page.getByTestId('card-em-aberto')).toContainText('R$ 0,00');
  });

  test('C12 (crítico) receber fiado em Dinheiro sem caixa aberto mostra a mensagem exata e destaca o banner', async ({
    page,
    request,
  }) => {
    const loja = await criarLoja(request);
    const pendente = await vendaPendente(loja, request, '99988877766');

    await abrirFinanceiro(page, loja.sessao, '/financeiro/a-receber');

    // Pagamento em Dinheiro com caixa fechado → mensagem do backend, verbatim.
    await receberFiado(page, pendente.id, '100,00', 'Dinheiro');
    await toastVisivel(page, 'Abra o caixa antes de receber em dinheiro.', 'error');

    // Banner do caixa entra em destaque (borda de warning por ~4s).
    const banner = page.locator('[role="status"]').filter({ hasText: 'Caixa fechado' });
    await expect(banner).toBeVisible();
    await expect
      .poll(async () => banner.evaluate((el) => getComputedStyle(el).borderTopColor), { timeout: 5_000 })
      .not.toBe('rgba(0, 0, 0, 0)');

    // O modal continua aberto: tentativa acima do saldo também mostra a mensagem exata.
    await page.getByTestId('input-valor-pagamento').fill('999,00');
    await page.getByTestId('select-forma-pagamento').click();
    await page.getByRole('option', { name: 'Pix' }).click();
    await page.getByTestId('botao-confirmar-pagamento').click();
    await toastVisivel(page, 'Pagamento excede o saldo da venda.', 'error');
    await page.getByTestId('botao-cancelar-pagamento').click();
    await expect(page.getByTestId('modal-receber-fiado')).toHaveCount(0);
  });

  test('fluxo de caixa lista a entrada em dinheiro e o filtro de tipo funciona', async ({
    page,
    request,
  }) => {
    const loja = await criarLoja(request);
    const pendente = await vendaPendente(loja, request, '99988877766');

    // Abre o caixa da loja e recebe R$ 30 em Dinheiro.
    const abrir = await request.post(`${API_URL}/api/caixa/abrir`, {
      headers: { Authorization: `Bearer ${loja.sessao.token}` },
      data: { valorAbertura: 0, observacoes: 'e2e' },
    });
    expect(abrir.status(), `abrir caixa: ${await abrir.text()}`).toBe(201);

    await abrirFinanceiro(page, loja.sessao, '/financeiro/a-receber');
    await receberFiado(page, pendente.id, '30,00', 'Dinheiro');
    await toastVisivel(page, 'Pagamento de R$ 30,00 registrado.', 'success');

    await page.getByTestId('submenu-fluxo-de-caixa').click();
    await expect(page).toHaveURL(/\/financeiro\/fluxo-caixa/);
    const linha = page.locator('[data-testid^="linha-movimento-"]').filter({ hasText: 'Venda (dinheiro)' }).first();
    await expect(linha).toBeVisible();
    await expect(linha).toContainText('30,00');
    await expect(page.getByTestId('fluxo-entradas')).toContainText('30,00');
    await expect(page.getByTestId('fluxo-saidas')).toContainText('R$ 0,00');
    await expect(page.getByTestId('fluxo-saldo')).toContainText('30,00');

    await page.getByTestId('filtro-tipo-movimento').click();
    await page.getByRole('option', { name: 'Saídas' }).click();
    await expect(page.getByTestId('fluxo-vazio')).toBeVisible();
  });

  test('C16 (crítico) isolamento: fiado da loja B não aparece para a demo nem vice-versa', async ({
    page,
    request,
  }) => {
    const loja = await criarLoja(request);
    const pendente = await vendaPendente(loja, request, '99988877766');

    const listarDemo = await request.get(`${API_URL}/api/vendas/a-receber`, {
      headers: { Authorization: `Bearer ${(await autenticar(request, DEMO)).token}` },
    });
    expect(listarDemo.ok()).toBeTruthy();
    const recebiveisDemo = await listarDemo.json();
    expect(recebiveisDemo.some((v: { id: string }) => v.id === pendente.id)).toBe(false);

    const listarB = await request.get(`${API_URL}/api/vendas/a-receber`, {
      headers: { Authorization: `Bearer ${loja.sessao.token}` },
    });
    const recebiveisB = await listarB.json();
    expect(recebiveisB.some((v: { id: string }) => v.id === pendente.id)).toBe(true);
    // A loja é nova: nenhum fiado de outra loja pode vazar para a lista dela.
    for (const v of recebiveisB as Array<{ id: string }>) {
      expect(v.id).toBe(pendente.id);
    }

    // UI: a demo busca pelo CPF do fiado da outra loja e não encontra nada.
    const sessaoDemo = await autenticar(request, DEMO);
    await abrirFinanceiro(page, sessaoDemo, '/financeiro/a-receber');
    await page.getByTestId('busca-cpf').fill('99988877766');
    await expect(page.getByTestId('a-receber-vazio')).toBeVisible();
    await expect(page.getByTestId('a-receber-vazio')).toContainText('Nenhuma venda encontrada para este CPF.');
  });

  test('C19 axe: /financeiro sem violações critical/serious em light/dark × 1440/375', async ({
    page,
    request,
  }) => {
    const sessaoDemo = await autenticar(request, DEMO);
    await abrirFinanceiro(page, sessaoDemo, '/financeiro');

    for (const largura of [1440, 375]) {
      await page.setViewportSize({ width: largura, height: largura === 1440 ? 900 : 812 });
      await page.waitForTimeout(400);
      for (const tema of ['light', 'dark'] as const) {
        await definirTema(page, tema);
        const res = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        const criticoSerio = res.violations.filter(
          (v) => v.impact === 'critical' || v.impact === 'serious'
        );
        expect(
          criticoSerio.map((v) => `${v.id}: ${v.help} :: ${v.nodes.map((n) => `[${n.target.join(' ')}] ${n.html}`).join(' | ')}`),
          `axe critical/serious em ${tema}/${largura}`
        ).toEqual([]);
      }
    }
  });

  test('período escolhido persiste no localStorage e o modo custom abre as datas', async ({
    page,
    request,
  }) => {
    const sessaoDemo = await autenticar(request, DEMO);
    await abrirFinanceiro(page, sessaoDemo, '/financeiro');

    await page.getByTestId('periodo-7dias').click();
    await expect(page.getByTestId('periodo-7dias')).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await expect(page.getByTestId('periodo-7dias')).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 });

    await page.getByTestId('periodo-custom').click();
    await expect(page.getByTestId('datas-custom')).toBeVisible();
    await page.getByTestId('data-inicio').fill('2026-01-01');
    await page.getByTestId('data-fim').fill('2026-01-31');
    await expect(page.getByTestId('periodo-custom')).toHaveAttribute('aria-pressed', 'true');
  });

  test('C10 a-receber vazio mostra estado claro', async ({ page, request }) => {
    const loja = await criarLoja(request);
    await abrirFinanceiro(page, loja.sessao, '/financeiro/a-receber');
    await expect(page.getByTestId('a-receber-total')).toContainText('R$ 0,00');
    await expect(page.getByTestId('a-receber-vazio')).toContainText('Nenhum fiado em aberto.');
  });

  test('C11 fluxo-caixa sem movimentos mostra estado vazio', async ({ page, request }) => {
    const loja = await criarLoja(request);
    await abrirFinanceiro(page, loja.sessao, '/financeiro/fluxo-caixa');
    await expect(page.getByTestId('fluxo-vazio')).toContainText('Nenhum movimento de caixa no período.');
    await expect(page.getByTestId('fluxo-saldo')).toContainText('R$ 0,00');
  });
});

test.describe('Fase 5b — capturas do Financeiro', () => {
  const PASTA = path.resolve(process.cwd(), 'screenshots');

  async function salvar(page: Page, nome: string): Promise<void> {
    const destino = path.join(PASTA, nome);
    await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
    await page.screenshot({ path: destino, fullPage: true });
    expect(fs.existsSync(destino), `${nome} salvo em frontend/screenshots`).toBeTruthy();
    expect(fs.statSync(destino).size).toBeGreaterThan(5_000);
  }

  test.beforeAll(() => {
    fs.mkdirSync(PASTA, { recursive: true });
  });

  test('16 capturas: dashboard, a-receber, fluxo-caixa e modal em light/dark × 1440/375', async ({
    page,
    request,
  }) => {
    test.setTimeout(240_000);
    const sessaoDemo = await autenticar(request, DEMO);

    // Fiado de verdade para o modal não nascer vazio.
    const produto = await request.post(`${API_URL}/api/produtos`, {
      headers: { Authorization: `Bearer ${sessaoDemo.token}` },
      data: {
        nome: `E2E Fin Screenshot ${RUN}`,
        precoVenda: 120,
        qtdEstoque: 5,
        estoqueMinimo: 1,
      },
    });
    expect(produto.status(), `criar produto: ${await produto.text()}`).toBe(201);
    const produtoId = (await produto.json()).id;
    const fiado = await criarVendaApi(request, sessaoDemo.token, {
      cpfCliente: '52998224725',
      itens: [{ tipo: 'Produto', produtoId, quantidade: 1, precoUnitario: 120 }],
      pagamentos: [{ forma: 'CartaoCredito', valor: 20 }],
    });

    const paginas: Array<{ rota: string; nome: string; marcador: string }> = [
      { rota: '/financeiro', nome: 'dashboard', marcador: 'financeiro-tres-numeros' },
      { rota: '/financeiro/a-receber', nome: 'a-receber', marcador: 'a-receber-total' },
      { rota: '/financeiro/fluxo-caixa', nome: 'fluxo-caixa', marcador: 'filtro-tipo-movimento' },
    ];

    for (const largura of [1440, 375]) {
      await page.setViewportSize({ width: largura, height: largura === 1440 ? 900 : 812 });
      for (const tema of ['light', 'dark'] as const) {
        for (const destino of [...paginas, { rota: 'modal', nome: 'modal', marcador: '' }]) {
          if (destino.nome === 'modal') {
            await entrar(page, sessaoDemo, '/financeiro/a-receber');
            await expect(
              page
                .locator(
                  `[data-testid="linha-a-receber-${fiado.id}"]:visible, [data-testid="card-a-receber-${fiado.id}"]:visible`
                )
                .first()
            ).toBeVisible({ timeout: 20_000 });
            await page.locator('[data-testid^="botao-receber-"]:visible').first().click();
            await expect(page.getByTestId('modal-receber-fiado')).toBeVisible();
          } else {
            await entrar(page, sessaoDemo, destino.rota);
            await expect(page.getByTestId(destino.marcador)).toBeVisible({ timeout: 20_000 });
            if (destino.nome === 'a-receber') {
              await expect(
                page
                  .locator(
                    `[data-testid="linha-a-receber-${fiado.id}"]:visible, [data-testid="card-a-receber-${fiado.id}"]:visible`
                  )
                  .first()
              ).toBeVisible({ timeout: 20_000 });
            }
            if (destino.nome === 'fluxo-caixa') {
              await page.waitForTimeout(800);
            }
          }
          await page.waitForTimeout(500);
          await definirTema(page, tema);
          await salvar(page, `financeiro-${destino.nome}-${tema}-${largura}.png`);
        }
      }
    }
  });
});
