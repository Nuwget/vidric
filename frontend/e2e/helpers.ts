import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:5080';

export const DEMO = {
  email: 'demo@vidric.app',
  senha: 'Demo@123',
  nome: 'Ana Souza',
  loja: 'Galeria Vidric',
  lojaId: 'c9df65a5-c90d-4ea0-8cfa-c692368226b2',
};

export const SUPER = { email: 'admin@lojagaleria.com', senha: 'Admin@123', nome: 'Super Admin' };

export interface Sessao {
  token: string;
  nome: string;
  papel: string;
  lojaId: string | null;
}

export async function autenticar(
  request: APIRequestContext,
  cred: { email: string; senha: string }
): Promise<Sessao> {
  const resposta = await request.post(`${API_URL}/api/auth/login`, {
    data: { email: cred.email, senha: cred.senha },
  });
  expect(resposta.ok(), `login de ${cred.email} deveria funcionar`).toBeTruthy();
  const corpo = await resposta.json();
  return { token: corpo.token, nome: corpo.nome, papel: corpo.papel, lojaId: corpo.lojaId };
}

/** Injeta a sessão no localStorage antes de qualquer script da aplicação. */
export async function entrar(page: Page, sessao: Sessao, rota = '/'): Promise<void> {
  await page.addInitScript((dados) => {
    window.localStorage.setItem('vidric.session', JSON.stringify(dados));
  }, sessao);
  await page.goto(rota);
}

export async function entrarNoPdv(page: Page, sessao: Sessao): Promise<void> {
  await entrar(page, sessao, '/pdv');
  await esperarPdvPronto(page);
}

/** Primeiro render do grid de produtos = busca inicial já respondeu. */
export async function esperarPdvPronto(page: Page): Promise<void> {
  await expect(page.getByTestId('busca-produto')).toBeVisible();
  await expect(page.locator('[data-testid^="card-produto-"]').first()).toBeVisible({ timeout: 20_000 });
}

export async function cabecalhoCarrinho(page: Page) {
  return page.getByTestId('total-carrinho');
}

export async function lerTotal(page: Page): Promise<string> {
  // Intl pt-BR separa "R$" do número com NBSP (U+00A0); normaliza para espaço comum.
  const texto = await page.getByTestId('total-carrinho').innerText();
  return texto.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

export async function toastVisivel(
  page: Page,
  texto: string,
  tipo: 'success' | 'error' = 'success'
): Promise<void> {
  await expect(
    page.locator(`[data-sonner-toast][data-type="${tipo}"]`).filter({ hasText: texto }).first()
  ).toBeVisible({ timeout: 15_000 });
}

export async function limparToasts(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.querySelectorAll('[data-sonner-toaster]').forEach((n) => n.replaceChildren());
  });
}

/** Busca no catálogo via API e devolve o primeiro produto cujo nome contém o termo. */
export async function produtoPorBusca(
  request: APIRequestContext,
  token: string,
  termo: string
): Promise<{ id: string; nome: string; qtdEstoque: number; precoVenda: number }> {
  const resposta = await request.get(`${API_URL}/api/produtos`, {
    params: { busca: termo, tamanho: 50 },
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(resposta.ok()).toBeTruthy();
  const itens = await resposta.json();
  const lista = Array.isArray(itens) ? itens : itens.itens;
  const encontrado = lista.find((p: { nome: string }) => p.nome.toLowerCase().includes(termo.toLowerCase()));
  expect(encontrado, `produto contendo "${termo}"`).toBeTruthy();
  return encontrado;
}

export function expirarToken(token: string): string {
  const [cabecalho, , assinatura] = token.split('.');
  const payload = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64url').toString('utf8')
  ) as Record<string, unknown>;
  payload.exp = Math.floor(Date.now() / 1000) - 120;
  delete payload.nbf;
  const novo = Buffer.from(JSON.stringify(payload)).toString('base64url').replace(/=+$/, '');
  return `${cabecalho}.${novo}.${assinatura}`;
}

/**
 * Carrinho "cheio" para as capturas: 2x o primeiro produto, os demais em 1,
 * mais uma película escolhida no atalho (produto + serviço de aplicação).
 * Clica sempre pelo id do card — nunca por posição — para não bater em lista
 * antiga enquanto o debounce da busca ainda não trocou os resultados.
 */
export async function preencherCarrinho(page: Page, produtoIds: string[], peliculoId: string): Promise<void> {
  await page.getByTestId('busca-produto').fill('');
  for (const [indice, id] of produtoIds.entries()) {
    const card = page.getByTestId(`card-produto-${id}`);
    await expect(card).toBeVisible();
    await card.click();
    if (indice === 0) await card.click();
  }

  await page.getByTestId('botao-pelicula').click();
  const escolha = page.getByTestId(`pelicula-${peliculoId}`);
  await expect(escolha).toBeVisible();
  await escolha.click();

  await expect(page.getByTestId('total-carrinho')).not.toHaveText('R$ 0,00');
}
