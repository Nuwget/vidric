'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ShoppingCart, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModalPagamento } from '@/components/pdv/modal-pagamento';
import { formatBRL } from '@/lib/format';
import { bottomSheet } from '@/lib/motion';
import { CodeBlock } from '../code-block';
import { Grupo, ShowcaseSection } from '../showcase-section';

type Modal = 'pagamento' | 'confirmacao' | 'formulario' | 'destrutivo' | 'folha' | null;

const GLASS_MODAL = 'glass-modal bg-transparent ring-0 rounded-[var(--modal-radius)] p-6';

const ITENS_DEMO = [
  { nome: 'Capinha iPhone 15', detalhe: 'Preta · un', qtd: 1, preco: 39.9 },
  { nome: 'Película Vidro Temperado', detalhe: 'iPhone 15 · c/ aplicação', qtd: 1, preco: 47.9 },
];
const TOTAL_DEMO = 87.8;

export function SecaoModais() {
  const [aberto, setAberto] = useState<Modal>(null);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const fechar = () => setAberto(null);

  return (
    <ShowcaseSection
      id="secao-modais"
      numero="06"
      titulo="Modais"
      descricao="O coração desta página. Pagamento é o componente REAL do PDV; os demais seguem a mesma receita glass-modal. Todos têm X no topo direito."
    >
      <Grupo rotulo="Abrir exemplos">
        <div className="flex flex-wrap gap-2.5">
          <Button type="button" data-testid="abrir-modal-pagamento" onClick={() => setAberto('pagamento')}>
            Pagamento (PDV)
          </Button>
          <Button type="button" variant="outline" data-testid="abrir-modal-confirmacao" onClick={() => setAberto('confirmacao')}>
            Confirmação
          </Button>
          <Button type="button" variant="outline" data-testid="abrir-modal-formulario" onClick={() => setAberto('formulario')}>
            Formulário
          </Button>
          <Button type="button" variant="destructive" data-testid="abrir-modal-destrutivo" onClick={() => setAberto('destrutivo')}>
            Destrutivo
          </Button>
          <Button type="button" variant="outline" data-testid="abrir-modal-folha" onClick={() => setAberto('folha')}>
            Bottom-sheet (carrinho)
          </Button>
        </div>
      </Grupo>

      {/* Componente real do PDV — mesmos campos, mesmos botões, zero API aqui. */}
      <ModalPagamento
        aberto={aberto === 'pagamento'}
        total={TOTAL_DEMO}
        salvando={false}
        onFechar={fechar}
        onConfirmar={(dados) => {
          fechar();
          toast.success('Pagamento confirmado (demo).', {
            description: `${dados.forma} · ${formatBRL(dados.valor)}`,
          });
        }}
      />

      <Dialog open={aberto === 'confirmacao'} onOpenChange={(novo) => !novo && fechar()}>
        <DialogContent className={`${GLASS_MODAL} sm:max-w-sm`}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-[-0.022em]">Desativar produto?</DialogTitle>
            <DialogDescription className="text-sm" style={{ color: 'var(--muted)' }}>
              Ele sai da busca do PDV, mas o histórico de movimentos permanece.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="h-12 flex-1 bg-transparent" onClick={fechar}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="h-12 flex-[1.4]"
              data-testid="confirmar-desativacao"
              onClick={() => {
                fechar();
                toast.success('Produto desativado (demo).');
              }}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={aberto === 'formulario'} onOpenChange={(novo) => !novo && fechar()}>
        <DialogContent className={`${GLASS_MODAL} sm:max-w-md`}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-[-0.022em]">Novo produto</DialogTitle>
            <DialogDescription className="text-sm" style={{ color: 'var(--muted)' }}>
              Mínimo para cadastrar: nome e preço de venda.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-modal-nome">Nome</Label>
            <Input
              id="ds-modal-nome"
              className="h-12"
              placeholder="Capinha iPhone 16"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-modal-preco">Preço de venda</Label>
            <Input
              id="ds-modal-preco"
              className="h-12 money"
              inputMode="decimal"
              placeholder="49,90"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="h-12 flex-1 bg-transparent" onClick={fechar}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="h-12 flex-[1.4]"
              disabled={nome.trim() === '' || preco.trim() === ''}
              onClick={() => {
                fechar();
                toast.success(`“${nome}” cadastrado (demo).`);
                setNome('');
                setPreco('');
              }}
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={aberto === 'destrutivo'} onOpenChange={(novo) => !novo && fechar()}>
        <DialogContent className={`${GLASS_MODAL} sm:max-w-sm`}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-[-0.022em]">Excluir produto?</DialogTitle>
            <DialogDescription className="text-sm" style={{ color: 'var(--muted)' }}>
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div
            className="flex items-start gap-2.5 p-3 text-sm"
            style={{
              background: 'var(--danger-soft)',
              color: 'var(--danger-text)',
              borderRadius: 'calc(var(--radius) * 0.7)',
            }}
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            O cadastro some do catálogo; o histórico de movimentos é mantido por auditoria.
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="h-12 flex-1 bg-transparent" onClick={fechar}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-12 flex-[1.4]"
              data-testid="confirmar-exclusao"
              onClick={() => {
                fechar();
                toast.success('Produto excluído (demo).');
              }}
            >
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom-sheet: padrão do carrinho do PDV (no app, < 768px). Aqui abre em
          qualquer viewport para inspeção. */}
      <AnimatePresence>
        {aberto === 'folha' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={fechar}
              className="fixed inset-0 z-50 bg-black/40"
              aria-hidden
            />
            <motion.div
              data-testid="folha-demo"
              variants={bottomSheet}
              initial="fechado"
              animate="aberto"
              exit="fechado"
              className="glass fixed bottom-0 left-0 right-0 z-50 max-h-[82dvh] overflow-auto p-4"
            >
              <div className="mb-1 flex justify-end">
                <button
                  type="button"
                  onClick={fechar}
                  aria-label="Fechar carrinho"
                  className="grid size-9 place-items-center rounded-full"
                  style={{ background: 'var(--glass-bg-thin)', color: 'var(--fg)' }}
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-xl font-bold tracking-[-0.022em]">
                <ShoppingCart className="size-5" />
                Carrinho
                <span className="ml-auto text-xs font-normal text-muted-foreground">2 itens</span>
              </div>
              <div className="mt-3 flex flex-col gap-2.5">
                {ITENS_DEMO.map((i) => (
                  <div
                    key={i.nome}
                    className="flex items-baseline justify-between gap-3 border-b pb-2.5"
                    style={{ borderColor: 'var(--glass-border)' }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{i.nome}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{i.detalhe} · ×{i.qtd}</p>
                    </div>
                    <span className="money text-sm font-semibold">{formatBRL(i.preco)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between py-3 text-[22px] font-bold money tracking-[-0.022em]">
                <span>Total</span>
                <span style={{ color: 'var(--accent-text)' }}>{formatBRL(TOTAL_DEMO)}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  fechar();
                  toast.success('Venda finalizada (demo).');
                }}
                className="flex w-full items-center justify-center gap-2 rounded-[14px] text-base font-bold"
                style={{
                  minHeight: 56,
                  background: 'var(--accent)',
                  color: 'var(--on-accent)',
                  border: 'none',
                  boxShadow: 'var(--shadow)',
                }}
              >
                Finalizar venda
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CodeBlock
        codigo={`// receita única: utilities do shadcn vencem @layer components —
// bg-transparent/ring-0/rounded cancelam bg-popover/ring-1/rounded-xl
<DialogContent className="glass-modal bg-transparent ring-0 rounded-[var(--modal-radius)] p-6 sm:max-w-md">
  <DialogHeader>…</DialogHeader>
  …
</DialogContent>

// bottom-sheet (carrinho): scrim + spring, max-h 82dvh
<motion.div variants={bottomSheet} initial="fechado" animate="aberto" exit="fechado"
  className="glass fixed left-0 right-0 bottom-0 z-50 p-4 max-h-[82dvh] overflow-auto">`}
      />
    </ShowcaseSection>
  );
}