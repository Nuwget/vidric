'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CodeBlock } from '../code-block';
import { ShowcaseSection } from '../showcase-section';

const CATEGORIAS = ['Capinhas', 'Películas', 'Cabos', 'Carregadores', 'Fones'];

export function SecaoSelects() {
  return (
    <ShowcaseSection
      id="secao-selects"
      numero="03"
      titulo="Selects"
      descricao="Nativo estilizado para filtros simples; custom (Radix) é o do modal de pagamento. Clique para abrir."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ds-select-nativo">Nativo estilizado</Label>
          <select
            id="ds-select-nativo"
            defaultValue="Películas"
            className="h-12 w-full px-3 text-sm outline-none"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'calc(var(--radius) * 0.7)',
              color: 'var(--fg)',
            }}
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="ds-select-custom">Custom (shadcn)</Label>
          <Select defaultValue="Películas">
            <SelectTrigger id="ds-select-custom" className="h-12 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="ds-select-erro">Com erro</Label>
          <Select>
            <SelectTrigger id="ds-select-erro" aria-invalid className="h-12 w-full">
              <SelectValue placeholder="Escolha a categoria" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p role="alert" className="text-sm font-semibold" style={{ color: 'var(--danger-text)' }}>
            Selecione uma categoria.
          </p>
        </div>
      </div>

      <CodeBlock
        codigo={`<Select value={forma} onValueChange={setForma}>
  <SelectTrigger className="h-12 w-full"><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem value="Pix">Pix</SelectItem>
  </SelectContent>
</Select>`}
      />
    </ShowcaseSection>
  );
}