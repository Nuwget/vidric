'use client';

import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '../code-block';
import { Grupo, ShowcaseSection } from '../showcase-section';

export function SecaoBotoes() {
  return (
    <ShowcaseSection
      id="secao-botoes"
      numero="01"
      titulo="Botões"
      descricao="Button do shadcn com os tokens do Vidric. Hover e active são vivos — passe o mouse e clique."
    >
      <Grupo rotulo="Variantes">
        <div className="flex flex-wrap items-center gap-2.5">
          <Button type="button">Primary</Button>
          <Button type="button" variant="secondary">Secondary</Button>
          <Button type="button" variant="outline">Outline</Button>
          <Button type="button" variant="ghost">Ghost</Button>
          <Button type="button" variant="destructive">Destructive</Button>
          <Button type="button" variant="link">Link</Button>
          <Button
            type="button"
            variant="outline"
            className="bg-transparent"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            Vidro (Cancelar do PDV)
          </Button>
        </div>
      </Grupo>

      <Grupo rotulo="Tamanhos">
        <div className="flex flex-wrap items-center gap-2.5">
          <Button type="button" size="sm">Small</Button>
          <Button type="button" size="default">Medium</Button>
          <Button type="button" size="lg">Large</Button>
        </div>
      </Grupo>

      <Grupo rotulo="Estados">
        <div className="flex flex-wrap items-center gap-2.5">
          <Button type="button">Confirmar</Button>
          <Button type="button" disabled>Disabled</Button>
          <Button type="button" disabled>
            <Loader2 data-icon="inline-start" className="animate-spin" />
            Salvando…
          </Button>
        </div>
      </Grupo>

      <Grupo rotulo="Só ícone">
        <div className="flex flex-wrap items-center gap-2.5">
          <Button type="button" size="icon" aria-label="Adicionar"><Plus /></Button>
          <Button type="button" size="icon" variant="outline" aria-label="Editar"><Pencil /></Button>
          <Button type="button" size="icon" variant="ghost" aria-label="Fechar"><X /></Button>
          <Button type="button" size="icon" variant="destructive" aria-label="Excluir"><Trash2 /></Button>
        </div>
      </Grupo>

      <CodeBlock
        codigo={`<Button>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
<Button size="sm | default | lg" />
<Button size="icon" aria-label="Adicionar"><Plus /></Button>
<Button disabled><Loader2 className="animate-spin" /> Salvando…</Button>`}
      />
    </ShowcaseSection>
  );
}