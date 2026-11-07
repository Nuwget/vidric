'use client';

import { AlertCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CodeBlock } from '../code-block';
import { Grupo, ShowcaseSection } from '../showcase-section';

const FOCUS = 'border-[var(--accent)] ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]';

export function SecaoInputs() {
  return (
    <ShowcaseSection
      id="secao-inputs"
      numero="06 · Componente"
      titulo="Inputs"
      descricao="Input e Textarea do shadcn nos cinco estados. O erro combina borda vermelha, ícone, aria-invalid e aria-describedby apontando para a mensagem. Todo campo tem label com htmlFor."
    >
      <Grupo rotulo="Estados (lado a lado)">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-input-default">Default</Label>
            <Input id="ds-input-default" placeholder="Nome do produto" className="h-11" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-input-hover">Hover</Label>
            <Input
              id="ds-input-hover"
              defaultValue="Cabo USB-C 1m"
              className="h-11 border-[var(--muted)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-input-focus">Focus</Label>
            <Input
              id="ds-input-focus"
              defaultValue="Película vidro"
              className={`h-11 ${FOCUS}`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-input-erro">Error</Label>
            <div className="relative">
              <Input
                id="ds-input-erro"
                aria-invalid
                aria-describedby="ds-input-erro-msg"
                defaultValue="-10"
                className="h-11 pr-9"
              />
              <AlertCircle
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2"
                style={{ color: 'var(--danger-text)' }}
                aria-hidden
              />
            </div>
            <p id="ds-input-erro-msg" role="alert" className="text-xs font-semibold" style={{ color: 'var(--danger-text)' }}>
              Informe um preço maior que zero.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-input-disabled">Disabled</Label>
            <Input id="ds-input-disabled" disabled defaultValue="Campo bloqueado" className="h-11" />
          </div>
        </div>
      </Grupo>

      <Grupo rotulo="Tipos">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-input-texto">Text</Label>
            <Input id="ds-input-texto" placeholder="Nome do produto" className="h-12" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-input-senha">Password</Label>
            <Input id="ds-input-senha" type="password" defaultValue="senha-secreta" className="h-12" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-input-search">Search (com ícone)</Label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id="ds-input-search"
                placeholder="Buscar por nome, modelo ou cor"
                className="h-12 pl-11"
                style={{ background: 'var(--surface)', borderColor: 'var(--glass-border)' }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-input-textarea">Textarea</Label>
            <Textarea id="ds-input-textarea" placeholder="Observações do produto…" rows={3} />
          </div>
        </div>
      </Grupo>

      <CodeBlock
        codigo={`<Label htmlFor="preco">Preço</Label>
<Input id="preco" className="h-11" />

{/* erro: ícone + aria-invalid + aria-describedby */}
<Input id="preco" aria-invalid aria-describedby="preco-erro" className="pr-9" />
<AlertCircle aria-hidden />
<p id="preco-erro" role="alert">Informe um preço maior que zero.</p>

<Input disabled />
<Textarea rows={3} />`}
      />
    </ShowcaseSection>
  );
}