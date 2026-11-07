'use client';

import { Copy, LogOut, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CodeBlock } from '../code-block';
import { Grupo, ShowcaseSection } from '../showcase-section';

const GLASS_DROPDOWN = 'glass-modal bg-transparent ring-0 rounded-[var(--radius)]';

export function SecaoDropdowns() {
  return (
    <ShowcaseSection
      id="secao-dropdowns"
      numero="09"
      titulo="Dropdowns"
      descricao="DropdownMenu do shadcn glassado. O avatar do app usa click-outside próprio — aqui, a primitiva com o mesmo visual."
    >
      <div className="flex flex-wrap items-start gap-8">
        <Grupo rotulo="Avatar (usuário)">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                data-testid="ds-avatar"
                aria-label="Menu do usuário"
                className="grid size-12 cursor-pointer place-items-center rounded-full text-sm font-semibold transition-transform active:scale-[0.94]"
                style={{
                  background: 'var(--accent-soft)',
                  color: 'var(--accent-text)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                AS
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={8} className={`${GLASS_DROPDOWN} min-w-[240px]`}>
              <DropdownMenuLabel className="flex flex-col gap-1">
                <span className="font-semibold tracking-[-0.01em]">Ana Souza</span>
                <span className="text-xs font-normal break-all" style={{ color: 'var(--muted)' }}>
                  demo@vidric.app
                </span>
                <span
                  className="mt-0.5 self-start rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}
                >
                  AdminLoja
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-testid="ds-menu-sair"
                className="font-semibold text-[var(--danger-text)] focus:bg-[var(--danger-soft)] focus:text-[var(--danger-text)]"
                onClick={() => toast.success('Sessão encerrada (demo).')}
              >
                <LogOut />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Grupo>

        <Grupo rotulo="Ações contextuais">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="icon" aria-label="Ações do produto" data-testid="ds-acoes">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={8} className={GLASS_DROPDOWN}>
              <DropdownMenuItem onClick={() => toast.info('Editar (demo).')}>
                <Pencil />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Duplicar (demo).')}>
                <Copy />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[var(--danger-text)] focus:bg-[var(--danger-soft)] focus:text-[var(--danger-text)]"
                onClick={() => toast.success('Excluído (demo).')}
              >
                <Trash2 />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Grupo>
      </div>

      <CodeBlock
        codigo={`<DropdownMenu>
  <DropdownMenuTrigger asChild><Button size="icon" variant="outline" /></DropdownMenuTrigger>
  {/* cancelar bg-popover/ring-1/rounded-lg da primitiva */}
  <DropdownMenuContent className="glass-modal bg-transparent ring-0 rounded-[var(--radius)]">
    <DropdownMenuItem>Editar</DropdownMenuItem>
    <DropdownMenuItem className="text-[var(--danger-text)] focus:bg-[var(--danger-soft)]">
      Excluir
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`}
      />
    </ShowcaseSection>
  );
}