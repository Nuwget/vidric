// Rodar antes de cada demo: repõe estoque baixo da loja demo via MovimentoEstoque.
// Uso: node scripts/reset-demo.mjs  (API em http://localhost:5080)
const API = process.env.API_URL ?? 'http://localhost:5080';

async function main() {
  const login = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@vidric.app', senha: 'Demo@123' }),
  });
  if (!login.ok) throw new Error(`Login falhou: HTTP ${login.status}`);
  const { token } = await login.json();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const res = await fetch(`${API}/api/produtos`, { headers });
  if (!res.ok) throw new Error(`Listar produtos falhou: HTTP ${res.status}`);
  const produtos = await res.json();

  let repostos = 0;
  for (const produto of produtos) {
    if (produto.qtdEstoque >= 5) continue;
    const mov = await fetch(`${API}/api/produtos/${produto.id}/movimentos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tipo: 'EntradaCompra', quantidade: 20, motivo: 'Reset demo' }),
    });
    if (!mov.ok) throw new Error(`Reposição de ${produto.nome} falhou: HTTP ${mov.status}`);
    const { produto: atualizado } = await mov.json();
    console.log(`${produto.nome}: ${produto.qtdEstoque} -> ${atualizado.qtdEstoque}`);
    repostos += 1;
  }
  console.log(repostos === 0 ? 'Nenhum produto abaixo de 5. Demo pronta.' : `${repostos} produto(s) repostos. Demo pronta.`);
}

main().catch((erro) => {
  console.error(erro.message);
  process.exit(1);
});