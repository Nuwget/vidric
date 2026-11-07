import { expect, test } from '@playwright/test';
import { API_URL, DEMO, SUPER, autenticar, entrar, expirarToken } from './helpers';

async function alternarSuspensao(request: import('@playwright/test').APIRequestContext, suspender: boolean) {
  const superSessao = await autenticar(request, SUPER);
  const resposta = await request.patch(
    `${API_URL}/api/admin/lojas/${DEMO.lojaId}/${suspender ? 'suspender' : 'reativar'}`,
    {
      headers: { Authorization: `Bearer ${superSessao.token}` },
      ...(suspender ? { data: { motivo: 'Validação Fase 4' } } : {}),
    }
  );
  expect(resposta.status(), `alterar suspensão (${suspender})`).toBeLessThan(300);
}

test.describe('Fase 4 — sessão expirada e loja suspensa', () => {
  test('T23 token expirado derruba para /login com toast', async ({ page, request }) => {
    const sessao = await autenticar(request, DEMO);
    await entrar(page, { ...sessao, token: expirarToken(sessao.token) }, '/pdv');

    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    await expect(
      page.locator('[data-sonner-toast][data-type="error"]').filter({ hasText: 'Sessão expirada' }).first()
    ).toBeVisible();
    await expect.poll(async () => page.evaluate(() => localStorage.getItem('vidric.session'))).toBeNull();
  });

  test('T24 + T7 loja suspensa durante o uso e no login', async ({ page, request }) => {
    const sessao = await autenticar(request, DEMO);

    await alternarSuspensao(request, true);
    try {
      // T24 — token emitido antes da suspensão passa pelo interceptor 403.
      await entrar(page, sessao, '/pdv');
      await expect(page).toHaveURL(/motivo=loja-suspensa/, { timeout: 15_000 });
      await expect(page.getByRole('alert').filter({ hasText: 'Loja suspensa' })).toContainText(
        'Loja suspensa. Contate o suporte.'
      );

      // T7 — nova tentativa de login é bloqueada com a mensagem dentro do card.
      await page.fill('#email', DEMO.email);
      await page.fill('#senha', DEMO.senha);
      await page.getByRole('button', { name: 'Entrar' }).click();
      await expect(page.getByRole('alert').filter({ hasText: 'Loja suspensa' })).toContainText(
        'Loja suspensa. Contate o suporte.'
      );
      // A loja suspensa nunca chega ao PDV: o token antigo continua sem sessão válida.
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByTestId('busca-produto')).toHaveCount(0);
    } finally {
      await alternarSuspensao(request, false);
    }

    // Loja reativada: o mesmo usuário volta a entrar normalmente.
    await page.goto('/login');
    await page.fill('#email', DEMO.email);
    await page.fill('#senha', DEMO.senha);
    await Promise.all([
      page.waitForURL('**/pdv', { timeout: 20_000 }),
      page.getByRole('button', { name: 'Entrar' }).click(),
    ]);
  });
});
