import { expect, test } from '@playwright/test';
import { DEMO, SUPER, autenticar, entrar, toastVisivel } from './helpers';

test.describe('Fase 4 — login e guard', () => {
  test('T3 /login renderiza o card com efeito liquid glass', async ({ page }) => {
    await page.goto('/login');
    // O default do app é dark; este teste cobre a receita light do vidro.
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));

    const card = page.locator('.glass');
    await expect(card).toBeVisible();
    await expect(card).toContainText('Entrar');

    const filtro = await card.evaluate((el) => getComputedStyle(el).backdropFilter);
    expect(filtro).toContain('blur(32px)');
    expect(filtro).toContain('saturate(1.9)');
    expect(filtro).toContain('url("#liquid-glass")');

    const fundo = await card.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(fundo).toBe('rgba(255, 255, 255, 0.38)');
  });

  test('T8 acessar /pdv sem token redireciona para /login', async ({ page }) => {
    await page.goto('/pdv');
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test('T5 login AdminLoja redireciona para /pdv', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', DEMO.email);
    await page.fill('#senha', DEMO.senha);
    await Promise.all([
      page.waitForURL('**/pdv', { timeout: 20_000 }),
      page.getByRole('button', { name: 'Entrar' }).click(),
    ]);

    const sessao = await page.evaluate(() => JSON.parse(localStorage.getItem('vidric.session') ?? 'null'));
    expect(sessao.papel).toBe('AdminLoja');
    await expect(page.getByTestId('busca-produto')).toBeVisible();
  });

  test('T4 login SuperAdmin redireciona para /admin', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', SUPER.email);
    await page.fill('#senha', SUPER.senha);
    await Promise.all([
      page.waitForURL('**/admin', { timeout: 20_000 }),
      page.getByRole('button', { name: 'Entrar' }).click(),
    ]);

    await expect(page.getByRole('heading', { name: 'Painel Super Admin' })).toBeVisible();
    await expect(page.locator('main')).toContainText('Em desenvolvimento');
  });

  test('T6 senha errada mostra toast de credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', DEMO.email);
    await page.fill('#senha', 'senha-errada-123');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await toastVisivel(page, 'Email ou senha inválidos', 'error');
    await expect(page).toHaveURL(/\/login/);
  });

  test('extra: rota raiz com sessão válida cai na rota do papel', async ({ page, request }) => {
    const sessao = await autenticar(request, DEMO);
    await entrar(page, sessao, '/');
    await expect(page).toHaveURL(/\/pdv/, { timeout: 15_000 });
  });
});
