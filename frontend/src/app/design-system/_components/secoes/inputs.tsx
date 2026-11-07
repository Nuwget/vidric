'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CodeBlock } from '../code-block';
import { Grupo, ShowcaseSection } from '../showcase-section';

export function SecaoInputs() {
  return (
    <ShowcaseSection
      id="secao-inputs"
      numero="02"
      titulo="Inputs"
      descricao="Input e Textarea do shadcn. O search com ícone é o mesmo padrão da busca do PDV."
    >
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
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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

      <Grupo rotulo="Estados">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-input-default">Default</Label>
            <Input id="ds-input-default" placeholder="Clique para ver o focus ring" className="h-12" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-input-focus">Focus (estático)</Label>
            <Input
              id="ds-input-focus"
              defaultValue="Película vidro temperado"
              className="h-12 border-ring ring-3 ring-ring/50"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-input-erro">Error</Label>
            <Input id="ds-input-erro" aria-invalid defaultValue="-10" className="h-12" />
            <p role="alert" className="text-sm font-semibold" style={{ color: 'var(--danger-text)' }}>
              Informe um preço maior que zero.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-input-disabled">Disabled</Label>
            <Input id="ds-input-disabled" disabled defaultValue="Campo bloqueado" className="h-12" />
          </div>
        </div>
      </Grupo>

      <CodeBlock
        codigo={`<Label htmlFor="nome">Nome</Label>
<Input id="nome" className="h-12" placeholder="Nome do produto" />
<Input aria-invalid /> {/* erro: borda + ring vermelhos */}
<Input disabled />
<Textarea rows={3} />`}
      />
    </ShowcaseSection>
  );
}