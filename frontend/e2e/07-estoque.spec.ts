import { expect, test, type APIRequestContext } from '@playwright/test';
import * as fs from 'node:fs';
import { API_URL, DEMO, autenticar, entrar, produtoPorBusca, toastVisivel, type Sessao } from './helpers';

const RUN = Date.now();

async function criarProdutoApi(
  request: APIRequestContext,
  token: string,
  dados: Record<string, unknown>
): Promise<{ id: string; nome: string; qtdEstoque: number; ativo: boolean }> {
  const resposta = await request.post(`${API_URL}/api/produtos`, {
    headers: { Authorization: `Bearer ${token}` },
    data: dados,
  });
  expect(resposta.status(), `criar produto: ${await resposta.text()}`).toBe(201);
  return resposta.json();
}

async function desativarApi(request: APIRequestContext, token: string, id: string): Promise<void> {
  await request.patch(`${API_URL}/api/produtos/${id}/ativo`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

test.describe('Fase 5a — Estoque', () => {
  let sessao: Sessao;

  test.beforeEach(async ({ request }) => {
    sessao = await autenticar(request, DEMO);
  });

  test('C2 /estoque mostra os 3 KPIs em vidro', async ({ page }) => {
    await entrar(page, sessao, '/estoque');
    await expect(page.getByTestId('kpi-valor-estoque')).toContainText('R$');
    await expect(page.getByTestId('kpi-abaixo-minimo')).toBeVisible();
    await expect(page.getByTestId('kpi-parados')).toContainText('R$');
    await expect(page.getByTestId('kpi-parados').getByText('ver relatório')).toBeVisible();
  });

  test('C3 clicar em "Abaixo do mínimo" filtra a lista', async ({ page, request }) => {
    // Cria a condição de propósito: o reset de demo pode ter zerado os alertas.
    const alerta = await criarProdutoApi(request, sessao.token, {
      nome: `E2E Alerta ${RUN}`,
      precoVenda: 10,
      qtdEstoque: 0,
      estoqueMinimo: 5,
    });
    await entrar(page, sessao, '/estoque');
    await expect(page.locator('[data-testid^="linha-produto-"]').first()).toBeVisible();

    await page.getByTestId('kpi-abaixo-minimo').click();
    await expect(page.getByTestId('kpi-abaixo-minimo')).toHaveAttribute('aria-pressed', 'true');
    const linhas = page.locator('[data-testid^="linha-produto-"]');
    await expect(page.getByTestId(`linha-produto-${alerta.id}`)).toBeVisible();
    const total = await linhas.count();
    expect(total).toBeGreaterThan(0);
    for (let i = 0; i < total; i += 1) {
      await expect(linhas.nth(i).getByTestId('badge-abaixo-minimo')).toBeVisible();
    }

    await page.getByTestId('kpi-abaixo-minimo').click();
    await expect(page.getByTestId('kpi-abaixo-minimo')).toHaveAttribute('aria-pressed', 'false');
    await desativarApi(request, sessao.token, alerta.id);
  });

  test('C4 busca "capinha" retorna em menos de 1s', async ({ page }) => {
    await entrar(page, sessao, '/estoque');
    await expect(page.locator('[data-testid^="linha-produto-"]').first()).toBeVisible();

    const inicio = Date.now();
    await page.getByTestId('busca-estoque').fill('capinha');
    await expect(page.locator('[data-testid^="linha-produto-"]').first()).toContainText('Capinha');
    expect(Date.now() - inicio).toBeLessThan(1000);
    const linhas = page.locator('[data-testid^="linha-produto-"]');
    const total = await linhas.count();
    expect(total).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < total; i += 1) {
      await expect(linhas.nth(i)).toContainText('Capinha');
    }
  });

  test('C5 Exportar CSV baixa estoque.csv com os headers corretos', async ({ page }) => {
    await entrar(page, sessao, '/estoque');
    await expect(page.getByTestId('botao-exportar-csv')).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('botao-exportar-csv').click(),
    ]);
    expect(download.suggestedFilename()).toBe('estoque.csv');
    const caminho = await download.path();
    const conteudo = fs.readFileSync(caminho, 'utf8');
    expect(conteudo.split('\n')[0].trim()).toBe(
      'nome,modelo,cor,categoria,codigoBarras,precoVenda,custo,qtdEstoque,estoqueMinimo'
    );
    expect(conteudo).toContain('Cabo USB-C Nylon Trancado');
  });

  test('C6 "+ Novo produto" abre /estoque/novo', async ({ page }) => {
    await entrar(page, sessao, '/estoque');
    await page.getByTestId('botao-novo-produto').click();
    await expect(page).toHaveURL(/\/estoque\/novo/);
    await expect(page.getByTestId('campo-nome')).toBeVisible();
    await expect(page.getByTestId('campo-preco')).toBeVisible();
  });

  test('C7 cadastro rápido só com nome e preço redireciona para o detalhe', async ({ page, request }) => {
    const nome = `E2E Minimo ${RUN}`;
    await entrar(page, sessao, '/estoque/novo');
    await page.getByTestId('campo-nome').fill(nome);
    await page.getByTestId('campo-preco').fill('30,00');
    await page.getByTestId('botao-salvar-produto').click();

    await toastVisivel(page, 'Produto cadastrado.');
    await expect(page).toHaveURL(/\/estoque\/[0-9a-f-]{36}/);
    await expect(page.getByRole('heading', { name: nome })).toBeVisible();
    await expect(page.getByTestId('estoque-atual')).toHaveText('0');

    const id = page.url().split('/').pop()!;
    await desativarApi(request, sessao.token, id);
  });

  test('C8 código de barras duplicado mostra toast vermelho e permanece na tela', async ({ page, request }) => {
    const barras = `E2E${RUN}`;
    const existente = await criarProdutoApi(request, sessao.token, {
      nome: `E2E Barras ${RUN}`,
      precoVenda: 10,
      codigoBarras: barras,
    });

    await entrar(page, sessao, '/estoque/novo');
    await page.getByTestId('campo-nome').fill(`E2E Duplicado ${RUN}`);
    await page.getByTestId('campo-preco').fill('10,00');
    await page.getByTestId('botao-mais-opcoes').click();
    await page.getByTestId('campo-codigo-barras').fill(barras);
    await page.getByTestId('botao-salvar-produto').click();

    await toastVisivel(page, 'Código de barras já cadastrado nesta loja.', 'error');
    await expect(page).toHaveURL(/\/estoque\/novo/);
    await desativarApi(request, sessao.token, existente.id);
  });

  test('C9 qtdEstoque inicial cria movimento "Estoque inicial"', async ({ page, request }) => {
    const nome = `E2E Inicial ${RUN}`;
    await entrar(page, sessao, '/estoque/novo');
    await page.getByTestId('campo-nome').fill(nome);
    await page.getByTestId('campo-preco').fill('20,00');
    await page.getByTestId('botao-mais-opcoes').click();
    await page.getByTestId('campo-qtd-inicial').fill('10');
    await page.getByTestId('botao-salvar-produto').click();

    await expect(page).toHaveURL(/\/estoque\/[0-9a-f-]{36}/);
    await expect(page.getByTestId('estoque-atual')).toHaveText('10');
    await expect(page.getByTestId('tabela-movimentos')).toContainText('Estoque inicial');
    await expect(page.getByTestId('tabela-movimentos')).toContainText('Entrada');

    const id = page.url().split('/').pop()!;
    await desativarApi(request, sessao.token, id);
  });

  test('C10 detalhe mostra dados e histórico de movimentos', async ({ page, request }) => {
    const cabo = await produtoPorBusca(request, sessao.token, 'Cabo USB-C');
    await entrar(page, sessao, `/estoque/${cabo.id}`);

    await expect(page.getByRole('heading', { name: cabo.nome })).toBeVisible();
    await expect(page.getByTestId('estoque-atual')).toHaveText(String(cabo.qtdEstoque));
    await expect(page.getByTestId('tabela-movimentos')).toBeVisible();
    expect(await page.getByTestId('tabela-movimentos').locator('[data-testid="movimento-row"]').count()).toBeGreaterThan(0);
  });

  test('C11 Entrada de 5 unidades soma no estoque e registra movimento', async ({ page, request }) => {
    const produto = await criarProdutoApi(request, sessao.token, {
      nome: `E2E Entrada ${RUN}`,
      precoVenda: 15,
      qtdEstoque: 10,
    });
    await entrar(page, sessao, `/estoque/${produto.id}`);
    await expect(page.getByTestId('estoque-atual')).toHaveText('10');

    await page.getByTestId('botao-entrada').click();
    await page.getByTestId('campo-quantidade').fill('5');
    await page.getByTestId('campo-motivo').fill('Compra de teste');
    await page.getByTestId('botao-confirmar-movimento').click();

    await toastVisivel(page, 'Movimento registrado.');
    await expect(page.getByTestId('estoque-atual')).toHaveText('15');
    const primeira = page.getByTestId('tabela-movimentos').locator('[data-testid="movimento-row"]').first();
    await expect(primeira).toContainText('Entrada');
    await expect(primeira).toContainText('+5');
    await expect(primeira).toContainText('Compra de teste');
    await desativarApi(request, sessao.token, produto.id);
  });

  test('C12 ajuste negativo maior que o estoque mostra erro do backend', async ({ page, request }) => {
    const produto = await criarProdutoApi(request, sessao.token, {
      nome: `E2E Ajuste ${RUN}`,
      precoVenda: 15,
      qtdEstoque: 3,
    });
    await entrar(page, sessao, `/estoque/${produto.id}`);

    await page.getByTestId('botao-ajuste').click();
    await page.getByTestId('select-tipo-ajuste').click();
    await page.getByRole('option', { name: 'Ajuste negativo (−)' }).click();
    await page.getByTestId('campo-quantidade').fill('10');
    await page.getByTestId('botao-confirmar-movimento').click();

    await toastVisivel(page, 'Estoque insuficiente', 'error');
    await expect(page.getByTestId('estoque-atual')).toHaveText('3');
    await desativarApi(request, sessao.token, produto.id);
  });

  test('C13 Perda exige motivo — form não envia sem', async ({ page, request }) => {
    const produto = await criarProdutoApi(request, sessao.token, {
      nome: `E2E Perda ${RUN}`,
      precoVenda: 15,
      qtdEstoque: 4,
    });
    await entrar(page, sessao, `/estoque/${produto.id}`);

    await page.getByTestId('botao-perda').click();
    await page.getByTestId('campo-quantidade').fill('1');
    await expect(page.getByTestId('botao-confirmar-movimento')).toBeDisabled();

    await page.getByTestId('campo-motivo').fill('Quebra no balcão');
    await expect(page.getByTestId('botao-confirmar-movimento')).toBeEnabled();
    await page.getByTestId('botao-confirmar-movimento').click();
    await toastVisivel(page, 'Movimento registrado.');
    await expect(page.getByTestId('estoque-atual')).toHaveText('3');
    await desativarApi(request, sessao.token, produto.id);
  });

  test('C14+C15 desativar some da lista; "Mostrar inativos" traz de volta', async ({ page }) => {
    const nome = `E2E Inativo ${RUN}`;
    await entrar(page, sessao, '/estoque/novo');
    await page.getByTestId('campo-nome').fill(nome);
    await page.getByTestId('campo-preco').fill('12,00');
    await page.getByTestId('botao-salvar-produto').click();
    await expect(page).toHaveURL(/\/estoque\/[0-9a-f-]{36}/);
    const id = page.url().split('/').pop()!;

    await page.getByTestId('botao-desativar').click();
    await toastVisivel(page, 'Produto desativado.');

    await entrar(page, sessao, '/estoque');
    await page.getByTestId('busca-estoque').fill(nome);
    await expect(page.getByTestId('estoque-vazio')).toBeVisible();

    await page.getByTestId('toggle-inativos').check();
    const linha = page.getByTestId(`linha-produto-${id}`);
    await expect(linha).toBeVisible();
    await expect(linha).toContainText('Inativo');
  });

  test('C16 relatório de parados mostra valor imobilizado no subtítulo', async ({ page }) => {
    await entrar(page, sessao, '/estoque/relatorios/parados');
    await expect(page.getByTestId('titulo-parados')).toHaveText('Produtos parados há 30 dias');
    await expect(page.getByTestId('valor-imobilizado')).toContainText('R$');
    await expect(page.getByTestId('valor-imobilizado')).toContainText('em mercadoria sem giro');
  });

  test('C17 select de janela recarrega o relatório com o filtro', async ({ page }) => {
    await entrar(page, sessao, '/estoque/relatorios/parados');
    await expect(page.getByTestId('titulo-parados')).toContainText('30 dias');

    await page.getByTestId('select-dias').click();
    const [resposta] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/produtos/relatorios/parados') && r.url().includes('dias=60')),
      page.getByRole('option', { name: '60 dias' }).click(),
    ]);
    expect(resposta.ok()).toBeTruthy();
    await expect(page.getByTestId('titulo-parados')).toHaveText('Produtos parados há 60 dias');
  });

  test('C18 (crítico) produto vendido no PDV some do relatório de parados', async ({ page, request }) => {
    const produto = await criarProdutoApi(request, sessao.token, {
      nome: `E2E Parado ${RUN}`,
      precoVenda: 50,
      custo: 10,
      qtdEstoque: 5,
    });
    const headers = { Authorization: `Bearer ${sessao.token}` };

    const antes = await request.get(`${API_URL}/api/produtos/relatorios/parados?dias=30`, { headers });
    const relatorioAntes = await antes.json();
    expect(relatorioAntes.itens.some((i: { produtoId: string }) => i.produtoId === produto.id)).toBe(true);

    await entrar(page, sessao, '/estoque/relatorios/parados');
    await expect(page.getByTestId(`item-parado-${produto.id}`)).toBeVisible();

    const venda = await request.post(`${API_URL}/api/vendas`, {
      headers,
      data: {
        itens: [{ tipo: 'Produto', produtoId: produto.id, quantidade: 1, precoUnitario: 50 }],
        pagamentos: [{ forma: 'Pix', valor: 50 }],
      },
    });
    expect(venda.status(), `venda: ${await venda.text()}`).toBe(201);

    const depois = await request.get(`${API_URL}/api/produtos/relatorios/parados?dias=30`, { headers });
    const relatorioDepois = await depois.json();
    expect(relatorioDepois.itens.some((i: { produtoId: string }) => i.produtoId === produto.id)).toBe(false);

    await page.reload();
    await expect(page.getByTestId(`item-parado-${produto.id}`)).toHaveCount(0);
    await desativarApi(request, sessao.token, produto.id);
  });

  test('C19 (crítico) isolamento: loja B não vê produtos da loja demo e vice-versa', async ({ page, request }) => {
    const emailB = `e2e-loja-b-${RUN}@vidric.app`;
    const registro = await request.post(`${API_URL}/api/auth/registrar-loja`, {
      data: {
        nomeLoja: `Galeria E2E ${RUN}`,
        nomeAdmin: 'Bruno Teste',
        emailAdmin: emailB,
        senhaAdmin: 'Senha@123',
      },
    });
    expect(registro.status(), `registrar loja B: ${await registro.text()}`).toBe(201);
    const sessaoB = await autenticar(request, { email: emailB, senha: 'Senha@123' });

    const produtoB = await criarProdutoApi(request, sessaoB.token, {
      nome: `E2E LojaB ${RUN}`,
      precoVenda: 99,
      qtdEstoque: 2,
    });
    const caboDemo = await produtoPorBusca(request, sessao.token, 'Cabo USB-C');

    const listaB = await (await request.get(`${API_URL}/api/produtos?tamanho=100`, {
      headers: { Authorization: `Bearer ${sessaoB.token}` },
    })).json();
    expect(listaB.some((p: { id: string }) => p.id === produtoB.id)).toBe(true);
    expect(listaB.some((p: { id: string }) => p.id === caboDemo.id)).toBe(false);

    const listaDemo = await (await request.get(`${API_URL}/api/produtos?busca=E2E%20LojaB&tamanho=100`, {
      headers: { Authorization: `Bearer ${sessao.token}` },
    })).json();
    expect(listaDemo.some((p: { id: string }) => p.id === produtoB.id)).toBe(false);

    await entrar(page, sessaoB, '/estoque');
    await expect(page.getByTestId(`linha-produto-${produtoB.id}`)).toBeVisible();
    await expect(page.getByTestId(`linha-produto-${caboDemo.id}`)).toHaveCount(0);
  });
});