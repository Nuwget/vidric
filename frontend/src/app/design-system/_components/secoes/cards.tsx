'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBRL } from '@/lib/format';
import { CodeBlock } from '../code-block';
import { Grupo, ShowcaseSection } from '../showcase-section';

const PRODUTOS_DEMO = [
  { nome: 'Capinha iPhone 15', modelo: 'iPhone 15', cor: 'Preta', qtd: 3, preco: 39.9, alerta: true },
  { nome: 'Cabo USB-C 1m', modelo: 'Universal', cor: 'Branco', qtd: 12, preco: 29.9, alerta: false },
];

const KPIS = [
  { rotulo: 'Valor em estoque', valor: formatBRL(2488), delta: '+R$ 320 esta semana', cor: 'var(--accent-text)' },
  { rotulo: 'Abaixo do mínimo', valor: '1', delta: 'repor hoje', cor: 'var(--warning-text)' },
  { rotulo: 'Parados há 30 dias', valor: formatBRL(2253), delta: 'sem giro', cor: 'var(--muted)' },
];

export function SecaoCards() {
  return (
    <ShowcaseSection
      id="secao-cards"
      numero="04"
      titulo="Cards"
      descricao="Card de produto (PDV), card de KPI (Estoque/Financeiro) e Card shadcn com header/footer. Clique no card de produto."
    >
      <Grupo rotulo="Card de produto (PDV)">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {PRODUTOS_DEMO.map((p) => (
            <motion.button
              key={p.nome}
              type="button"
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={() => toast.success(`${p.nome} adicionado (demo).`)}
              className="glass-card flex cursor-pointer flex-col gap-1 p-3.5 text-left"
            >
              <span className="text-[15px] font-semibold line-clamp-2">{p.nome}</span>
              <span className="text-xs text-muted-foreground">{p.modelo} · {p.cor}</span>
              <span className="text-[11px] text-muted-foreground">
                Estoque: <span className="font-semibold text-foreground">{p.qtd}</span>
              </span>
              <span className="mt-1 font-bold money tracking-[-0.02em]" style={{ color: 'var(--accent-text)' }}>
                {formatBRL(p.preco)}
              </span>
              {p.alerta && (
                <span
                  className="self-start rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: 'var(--danger-soft)', color: 'var(--danger-text)' }}
                >
                  Abaixo do mínimo
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </Grupo>

      <Grupo rotulo="Card de KPI">
        <div className="grid gap-3 sm:grid-cols-3">
          {KPIS.map((k) => (
            <div key={k.rotulo} className="glass flex flex-col gap-1 p-4">
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{k.rotulo}</span>
              <span className="money text-[32px] font-bold leading-tight tracking-[-0.03em]">{k.valor}</span>
              <span className="flex items-center gap-1 text-xs font-medium" style={{ color: k.cor }}>
                <TrendingUp className="size-3" />
                {k.delta}
              </span>
            </div>
          ))}
        </div>
      </Grupo>

      <Grupo rotulo="Card com header/footer (shadcn)">
        <Card className="glass max-w-md rounded-[var(--radius)] bg-transparent ring-0">
          <CardHeader>
            <CardTitle>Resumo do dia</CardTitle>
            <CardDescription>Vendas e recebimentos de hoje.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              12 vendas · <span className="money font-semibold">{formatBRL(846.5)}</span> vendidos
            </p>
          </CardContent>
          <CardFooter>
            <Button type="button" size="sm" variant="outline" onClick={() => toast.info('Relatório completo em breve (demo).')}>
              Ver relatório
            </Button>
          </CardFooter>
        </Card>
      </Grupo>

      <CodeBlock
        codigo={`// produto: .glass-card sobre uma camada .glass (refração do container)
<button className="glass-card text-left p-3.5 flex flex-col gap-1">…</button>

// KPI: vidro direto + número tabular
<div className="glass p-4">
  <span className="text-xs" style={{ color: 'var(--muted)' }}>Valor em estoque</span>
  <span className="text-[32px] font-bold money">R$ 2.488,00</span>
</div>

// shadcn Card glassado: cancelar bg-card/ring-1/rounded-xl
<Card className="glass bg-transparent ring-0 rounded-[var(--radius)]">…</Card>`}
      />
    </ShowcaseSection>
  );
}