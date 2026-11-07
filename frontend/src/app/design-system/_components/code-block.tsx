'use client';

import { useEffect, useId, useState } from 'react';
import { Check, Copy } from 'lucide-react';

/* Realce shiki (github-light/github-dark conforme o tema da página). O tema é
   lido de data-theme no <html> e re-realçado via MutationObserver quando o
   painel troca light/dark. Fallback de texto puro enquanto carrega ou se falhar. */
export function CodeBlock({
  codigo,
  numerosLinhas = false,
}: {
  codigo: string;
  numerosLinhas?: boolean;
}) {
  const [copiado, setCopiado] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [tema, setTema] = useState<'light' | 'dark'>('dark');
  // Cada bloco é um region landmark; o nome precisa ser único (axe landmark-unique).
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');

  useEffect(() => {
    const read = (): 'light' | 'dark' =>
      document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    setTema(read());
    const obs = new MutationObserver(() => setTema(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    let ativo = true;
    import('shiki')
      .then(({ codeToHtml }) =>
        codeToHtml(codigo, {
          lang: 'tsx',
          theme: tema === 'light' ? 'github-light' : 'github-dark',
        }),
      )
      .then((h) => {
        if (ativo) setHtml(h);
      })
      .catch(() => {
        if (ativo) setHtml(null);
      });
    return () => {
      ativo = false;
    };
  }, [codigo, tema]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div
      role="region"
      aria-label={`Exemplo de código ${id}`}
      data-no-contrast
      className={`ds-code glass relative p-3 pr-11 ${numerosLinhas ? 'ds-code-lines' : ''}`}
    >
      {html ? (
        <div
          className="ds-shiki overflow-x-auto leading-relaxed"
          tabIndex={0}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto font-mono text-xs leading-relaxed" tabIndex={0}>
          <code>{codigo}</code>
        </pre>
      )}
      <button
        type="button"
        onClick={copiar}
        aria-label={copiado ? 'Copiado!' : 'Copiar código'}
        className="absolute right-2 top-2 grid size-7 place-items-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        style={{ color: copiado ? 'var(--accent-text)' : 'var(--muted)' }}
      >
        {copiado ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      </button>
      <span aria-live="polite" className="sr-only">
        {copiado ? 'Copiado!' : ''}
      </span>
    </div>
  );
}