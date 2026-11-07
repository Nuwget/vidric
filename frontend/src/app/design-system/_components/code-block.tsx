'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function CodeBlock({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div
      className="ds-code relative p-3 pr-11"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'calc(var(--radius) * 0.7)',
      }}
    >
      <pre className="overflow-x-auto font-mono text-xs leading-relaxed">
        <code>{codigo}</code>
      </pre>
      <button
        type="button"
        onClick={copiar}
        aria-label="Copiar código"
        className="absolute right-2 top-2 grid size-7 place-items-center rounded-md transition-colors"
        style={{ color: copiado ? 'var(--accent-text)' : 'var(--muted)' }}
      >
        {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}