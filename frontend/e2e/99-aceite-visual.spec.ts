import { expect, test } from '@playwright/test';
import { DEMO, autenticar, entrar, esperarPdvPronto, preencherCarrinho, produtoPorBusca } from './helpers';

const CAPTURAS = [
  { nome: 'pdv-vidro-light-1440', largura: 1440, altura: 900, tema: 'light' },
  { nome: 'pdv-vidro-dark-1440', largura: 1440, altura: 900, tema: 'dark' },
  { nome: 'pdv-vidro-light-375', largura: 375, altura: 812, tema: 'light' },
  { nome: 'pdv-vidro-dark-375', largura: 375, altura: 812, tema: 'dark' },
] as const;

test('capturas de aceite do liquid glass no PDV', async ({ page, request }) => {
  const sessao = await autenticar(request, DEMO);
  await entrar(page, sessao, '/pdv');
  await esperarPdvPronto(page);

  const capinha = await produtoPorBusca(request, sessao.token, 'capinha');
  const pelicula = await produtoPorBusca(request, sessao.token, 'película');
  await preencherCarrinho(page, [capinha.id], pelicula.id);

  for (const captura of CAPTURAS) {
    await page.setViewportSize({ width: captura.largura, height: captura.altura });
    await page.waitForTimeout(600);
    const filtro = await page
      .locator('section.glass')
      .first()
      .evaluate((el) => getComputedStyle(el).backdropFilter);
    expect(filtro).toContain('url("#liquid-glass")');

    await page.evaluate((tema) => {
      document.documentElement.dataset.theme = tema;
    }, captura.tema);
    await page.waitForTimeout(400);
    await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
    await page.screenshot({ path: `screenshots/${captura.nome}.png`, fullPage: false });
  }
});
