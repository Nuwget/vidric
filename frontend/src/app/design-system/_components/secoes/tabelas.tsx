'use client';

import { PackageSearch, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatBRL } from '@/lib/format';
import { CodeBlock } from '../code-block';
import { Grupo, ShowcaseSection } from '../showcase-section';

const LINHAS = [
  { nome: 'Capinha iPhone 15', qtd: 3, preco: 39.9, alerta: 'Abaixo do mínimo' },
  { nome: 'Cabo USB-C 1m', qtd: 12, preco: 29.9, alerta: null },
  { nome: 'Película Vidro Temperado', qtd: 0, preco: 47.9, alerta: 'Esgotado' },
];

const ZEBRA = 'odd:bg-[color-mix(in_oklch,var(--fg)_4%,transparent)]';

export function SecaoTabelas() {
  return (
    <ShowcaseSection
      id="secao-tabelas"
      numero="08"
      titulo="Tabelas"
      descricao="Table do shadcn dentro de camada .glass: header translúcido, zebra sutil e ações à direita."
    >
      <Grupo rotulo="Com dados">
        <div className="glass overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[var(--glass-bg-thin)] hover:bg-transparent">
                <TableHead>Produto</TableHead>
                <TableHead className="w-20 text-right">Estoque</TableHead>
                <TableHead className="w-28 text-right">Preço</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LINHAS.map((l) => (
                <TableRow key={l.nome} className={ZEBRA}>
                  <TableCell>
                    <span className="font-medium">{l.nome}</span>
                    {l.alerta && (
                      <span
                        className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: 'var(--danger-soft)', color: 'var(--danger-text)' }}
                      >
                        {l.alerta}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="money text-right font-semibold">{l.qtd}</TableCell>
                  <TableCell className="money text-right">{formatBRL(l.preco)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Editar ${l.nome}`}
                        onClick={() => toast.info(`Editando ${l.nome} (demo).`)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Excluir ${l.nome}`}
                        onClick={() => toast.success(`${l.nome} excluído (demo).`)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Grupo>

      <div className="grid gap-4 lg:grid-cols-2">
        <Grupo rotulo="Empty state">
          <div className="glass flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
            <PackageSearch className="size-8" style={{ color: 'var(--muted)' }} />
            <p className="font-semibold">Nenhum produto encontrado</p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Ajuste a busca ou cadastre um novo produto.
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-2"
              onClick={() => toast.info('Cadastro abre em /estoque/novo (fora desta página).')}
            >
              <Plus data-icon="inline-start" />
              Novo produto
            </Button>
          </div>
        </Grupo>

        <Grupo rotulo="Loading (skeleton)">
          <div className="glass overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[var(--glass-bg-thin)] hover:bg-transparent">
                  <TableHead>Produto</TableHead>
                  <TableHead className="w-20 text-right">Estoque</TableHead>
                  <TableHead className="w-28 text-right">Preço</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[0, 1, 2, 3].map((i) => (
                  <TableRow key={i} className={ZEBRA}>
                    <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="ml-auto h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Grupo>
      </div>

      <CodeBlock
        codigo={`<div className="glass overflow-hidden">
  <Table>
    <TableHeader>
      <TableRow className="bg-[var(--glass-bg-thin)]">…</TableRow>
    </TableHeader>
    <TableBody>
      <TableRow className="odd:bg-[color-mix(in_oklch,var(--fg)_4%,transparent)]">…</TableRow>
    </TableBody>
  </Table>
</div>

<Skeleton className="h-4 w-3/4" /> {/* loading */}`}
      />
    </ShowcaseSection>
  );
}