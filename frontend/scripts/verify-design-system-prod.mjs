#!/usr/bin/env node
/**
 * Teste 13 (crítico): /design-system retorna 404 em produção.
 *
 * Nunca roda `next build` dentro de frontend/ (o dev server vive em :3000 e um
 * build in-place corrompe o .next dele). Estratégia:
 *   1. copia frontend/ para um diretório temporário (sem node_modules/.next);
 *   2. junction node_modules -> o real (mklink /J, sem reinstalar);
 *   3. `node next build` e `node next start -p <porta livre>` spawnados direto
 *      (sem wrapper npm => child.kill() não órfã ninguém);
 *   4. afirma /design-system = 404 e /login = 200;
 *   5. mata o processo, remove a junction e o temporário.
 *
 * Uso: node scripts/verify-design-system-prod.mjs
 * DS_PROD_PORT força a porta inicial (padrão 3117; sobe até achar livre).
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FRONTEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXCLUIR = new Set([
  'node_modules',
  '.next',
  'screenshots',
  'playwright-report',
  'playwright-results',
  'tsconfig.tsbuildinfo',
]);

function portaLivre(inicial) {
  return new Promise((resolve, reject) => {
    if (inicial > 3200) return reject(new Error('nenhuma porta livre entre a inicial e 3200'));
    const srv = net.createServer();
    srv.once('error', () => resolve(portaLivre(inicial + 1)));
    srv.listen(inicial, () => srv.close(() => resolve(inicial)));
  });
}

async function aguardarServidor(base, timeoutMs = 60_000) {
  const inicio = Date.now();
  while (Date.now() - inicio < timeoutMs) {
    try {
      const r = await fetch(`${base}/login`, { redirect: 'manual', signal: AbortSignal.timeout(3000) });
      if (r.status === 200) return;
    } catch {
      // ainda subindo
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`servidor não respondeu 200 em /login dentro de ${timeoutMs}ms`);
}

async function main() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'vidric-ds-prod-'));
  const junction = path.join(temp, 'node_modules');
  let servidor = null;
  let ok = false;

  try {
    console.log(`[1/5] Copiando frontend para ${temp}`);
    fs.cpSync(FRONTEND, temp, {
      recursive: true,
      filter: (src) => !EXCLUIR.has(path.relative(FRONTEND, src).split(path.sep)[0]),
    });
    const mk = spawnSync('cmd.exe', ['/c', 'mklink', '/J', junction, path.join(FRONTEND, 'node_modules')], {
      stdio: 'pipe',
      encoding: 'utf8',
    });
    if (mk.status !== 0) throw new Error(`mklink /J falhou: ${mk.stderr || mk.stdout}`);

    const nextBin = path.join('node_modules', 'next', 'dist', 'bin', 'next');
    const env = { ...process.env, NODE_ENV: 'production' };

    console.log('[2/5] next build (cópia isolada, NODE_ENV=production)…');
    const build = spawnSync(process.execPath, [nextBin, 'build'], {
      cwd: temp,
      env,
      stdio: 'inherit',
      timeout: 480_000,
    });
    if (build.status !== 0) throw new Error(`next build falhou (exit ${build.status})`);

    const porta = await portaLivre(Number(process.env.DS_PROD_PORT) || 3117);
    const base = `http://localhost:${porta}`;
    console.log(`[3/5] next start -p ${porta} (processo node direto, sem wrapper npm)`);
    servidor = spawn(process.execPath, [nextBin, 'start', '-p', String(porta)], {
      cwd: temp,
      env,
      stdio: 'pipe',
    });
    let logServidor = '';
    servidor.stdout.on('data', (d) => (logServidor += d));
    servidor.stderr.on('data', (d) => (logServidor += d));
    servidor.on('exit', (code) => {
      if (!ok && code !== null && code !== 0) {
        console.error(`next start morreu (exit ${code}):\n${logServidor}`);
      }
    });

    await aguardarServidor(base);
    console.log('[4/5] Verificando rotas…');
    const login = await fetch(`${base}/login`, { redirect: 'manual' });
    const ds = await fetch(`${base}/design-system`, { redirect: 'manual' });
    console.log(`      GET /login          -> ${login.status} (esperado 200)`);
    console.log(`      GET /design-system  -> ${ds.status} (esperado 404)`);
    if (login.status !== 200) throw new Error(`/login retornou ${login.status}, esperado 200`);
    if (ds.status !== 404) throw new Error(`/design-system retornou ${ds.status}, esperado 404 — VAZOU EM PRODUÇÃO`);

    ok = true;
    console.log('[5/5] PASS — teste 13: /design-system retorna 404 em build de produção real.');
  } finally {
    if (servidor && servidor.exitCode === null) {
      servidor.kill();
      await new Promise((r) => {
        servidor.once('exit', r);
        setTimeout(r, 5000).unref();
      });
    }
    if (fs.existsSync(junction)) {
      spawnSync('cmd.exe', ['/c', 'rmdir', junction], { stdio: 'pipe' });
    }
    fs.rmSync(temp, { recursive: true, force: true });
  }

  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(`FAIL — teste 13: ${err.message}`);
  process.exitCode = 1;
});