'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '../code-block';
import { Grupo, ShowcaseSection } from '../showcase-section';

export function SecaoToasts() {
  return (
    <ShowcaseSection
      id="secao-toasts"
      numero="11 · Componente"
      titulo="Toasts"
      descricao="Sonner (ui/sonner). Nesta página: bottom-right no desktop, full-width embaixo no mobile. Auto-dismiss em 4s; manual não some."
    >
      <Grupo rotulo="Tipos (auto-dismiss)">
        <div className="flex flex-wrap gap-2.5">
          <Button
            type="button"
            data-testid="toast-sucesso"
            onClick={() => toast.success('Produto cadastrado.', { description: 'Capinha iPhone 15 salva no catálogo.' })}
          >
            Sucesso
          </Button>
          <Button
            type="button"
            variant="destructive"
            data-testid="toast-erro"
            onClick={() => toast.error('Estoque insuficiente.', { description: 'Disponível: 3, solicitado: 10.' })}
          >
            Erro
          </Button>
          <Button
            type="button"
            variant="outline"
            data-testid="toast-warning"
            onClick={() => toast.warning('Abaixo do mínimo.', { description: 'Cabo USB-C: restam 4 unidades.' })}
          >
            Warning
          </Button>
          <Button
            type="button"
            variant="secondary"
            data-testid="toast-info"
            onClick={() => toast.info('Relatório atualizado.', { description: 'Janela de 30 dias.' })}
          >
            Info
          </Button>
        </div>
      </Grupo>

      <Grupo rotulo="Manual (com X, não some)">
        <div className="flex flex-wrap gap-2.5">
          <Button
            type="button"
            variant="outline"
            data-testid="toast-manual"
            onClick={() =>
              toast.info('Conexão instável.', {
                description: 'Feche manualmente no X — este toast não expira.',
                duration: Infinity,
              })
            }
          >
            Disparar toast manual
          </Button>
        </div>
      </Grupo>

      <Grupo rotulo="Acessibilidade nativa (Sonner)">
        <p className="text-sm text-muted-foreground">
          Sucesso e info anunciam com <code className="font-mono text-xs">role=&quot;status&quot;</code> (polite);
          erro e warning com <code className="font-mono text-xs">role=&quot;alert&quot;</code> (assertive).
          O auto-dismiss pausa quando o mouse ou o foco do teclado está sobre o toast, e o botão de
          fechar tem <code className="font-mono text-xs">aria-label=&quot;Close toast&quot;</code>. Nenhum wrapper extra é necessário.
        </p>
      </Grupo>

      <CodeBlock
        codigo={`import { toast } from 'sonner';

toast.success('Produto cadastrado.', { description: '…' });
toast.error('Estoque insuficiente.', { description: 'Disponível: 3.' });
toast.warning('Abaixo do mínimo.');
toast.info('Relatório atualizado.');
toast.info('Manual.', { duration: Infinity }); // closeButton no Toaster`}
      />
    </ShowcaseSection>
  );
}