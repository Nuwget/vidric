'use client';

import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { BuscaProduto } from '@/components/pdv/busca-produto';
import { Carrinho } from '@/components/pdv/carrinho';
import { ModalPagamento } from '@/components/pdv/modal-pagamento';
import { SeletorPelicula } from '@/components/pdv/seletor-pelicula';
import { CHAVE_CAIXA_ATUAL } from '@/hooks/useCaixa';
import { CHAVE_PRODUTOS } from '@/hooks/useProdutos';
import { api, apiErrorMessage, apiErrorStatus } from '@/lib/api';
import { avisarCaixaFechado } from '@/lib/caixa-aviso';
import { formatBRL } from '@/lib/format';
import { bottomSheet } from '@/lib/motion';
import {
  adicionarItem,
  alterarQuantidade,
  novoItemProduto,
  novoItemServico,
  paraItensVenda,
  removerItem,
  totalCarrinho,
  type ItemCarrinho,
} from '@/lib/pdv';
import type { CriarVendaInput, FormaPagamento, Produto, VendaDetalhe } from '@/types/api';

export default function PdvPage() {
  const queryClient = useQueryClient();

  const [busca, setBusca] = useState('');
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [folhaAberta, setFolhaAberta] = useState(false);
  const [pagamentoAberto, setPagamentoAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const total = totalCarrinho(itens);

  const adicionar = useCallback((item: ItemCarrinho) => {
    setItens((atual) => adicionarItem(atual, item));
  }, []);

  function aoEscolherProduto(produto: Produto) {
    adicionar(novoItemProduto(produto));
  }

  function aoEscolherPelicula(produto: Produto) {
    setItens((atual) => adicionarItem(adicionarItem(atual, novoItemProduto(produto)), novoItemServico()));
  }

  async function confirmarVenda(dados: { forma: FormaPagamento; valor: number; cpf: string | null }) {
    if (itens.length === 0) return;
    setSalvando(true);

    const corpo: CriarVendaInput = {
      cpfCliente: dados.cpf,
      itens: paraItensVenda(itens),
      pagamentos: [{ forma: dados.forma, valor: dados.valor }],
    };

    try {
      const { data } = await api.post<VendaDetalhe>('/api/vendas', corpo);
      toast.success(
        data.saldo > 0
          ? `Venda registrada — saldo de ${formatBRL(data.saldo)} a receber`
          : `Venda registrada — ${formatBRL(data.total)} recebidos`,
      );
      setItens([]);
      setPagamentoAberto(false);
      setFolhaAberta(false);
      await queryClient.invalidateQueries({ queryKey: [CHAVE_PRODUTOS] });
      await queryClient.invalidateQueries({ queryKey: [CHAVE_CAIXA_ATUAL] });
    } catch (error) {
      const status = apiErrorStatus(error);
      const mensagem = apiErrorMessage(error);

      if (status === 409) {
        toast.error('Outro operador finalizou a última unidade. Atualize a busca.');
      } else if (status === 400 && mensagem?.includes('Abra o caixa')) {
        toast.error(mensagem);
        avisarCaixaFechado();
        await queryClient.invalidateQueries({ queryKey: [CHAVE_CAIXA_ATUAL] });
      } else if (status === 400 && mensagem?.includes('Pagamento excede')) {
        toast.error(mensagem);
      } else {
        toast.error(mensagem ?? 'Não foi possível registrar a venda.');
      }
    } finally {
      setSalvando(false);
    }
  }

  const PAINEL_CARRINHO = (
    <Carrinho
      itens={itens}
      finalizando={salvando}
      onMais={(chave) => setItens((atual) => alterarQuantidade(atual, chave, 1))}
      onMenos={(chave) => setItens((atual) => alterarQuantidade(atual, chave, -1))}
      onRemover={(chave) => setItens((atual) => removerItem(atual, chave))}
      onFinalizar={() => {
        setPagamentoAberto(true);
        setFolhaAberta(false);
      }}
    />
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 min-h-full pb-[86px] md:pb-0">
        <section className="glass p-4 flex flex-col gap-3.5">
          <SeletorPelicula onEscolher={aoEscolherPelicula} />
          <BuscaProduto busca={busca} onBusca={setBusca} onAdicionar={aoEscolherProduto} />
        </section>

        <aside data-testid="carrinho-lateral" className="glass p-4 hidden md:flex md:flex-col lg:sticky lg:top-0 lg:self-start lg:max-h-[calc(100dvh-160px)] min-h-0">
          {PAINEL_CARRINHO}
        </aside>
      </div>

      {/* Mobile (< 768px): barra flutuante + carrinho em bottom sheet. */}
      <button
        type="button"
        data-testid="abrir-carrinho"
        onClick={() => setFolhaAberta(true)}
        className="md:hidden fixed left-3.5 right-3.5 bottom-3.5 z-40 flex items-center gap-2.5 px-4 font-semibold text-[15px]"
        style={{
          minHeight: 48,
          background: 'var(--accent-glass)',
          color: 'var(--on-accent)',
          border: 'none',
          borderRadius: 'calc(var(--radius) * 0.75)',
          boxShadow: '0 6px 20px rgba(0,0,0,.18)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        }}
      >
        Ver carrinho
        <span
          className="px-2.5 py-0.5 rounded-full text-[13px]"
          style={{ background: 'rgba(255,255,255,0.22)' }}
        >
          {itens.reduce((acc, i) => acc + i.quantidade, 0)}
        </span>
        <span className="ml-auto money">{formatBRL(total)}</span>
      </button>

      <AnimatePresence>
        {folhaAberta && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFolhaAberta(false)}
              className="md:hidden fixed inset-0 z-50 bg-black/40"
              aria-hidden
            />
            <motion.div
              id="carrinho-folha"
              variants={bottomSheet}
              initial="fechado"
              animate="aberto"
              exit="fechado"
              className="md:hidden glass fixed left-0 right-0 bottom-0 z-50 p-4 max-h-[82dvh] overflow-auto"
            >
              <div className="flex justify-end mb-1">
                <button
                  type="button"
                  onClick={() => setFolhaAberta(false)}
                  aria-label="Fechar carrinho"
                  className="size-12 grid place-items-center rounded-[calc(var(--radius)*0.6)] text-sm"
                  style={{ color: 'var(--muted)' }}
                >
                  fechar
                </button>
              </div>
              {PAINEL_CARRINHO}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ModalPagamento
        aberto={pagamentoAberto}
        total={total}
        salvando={salvando}
        onFechar={() => setPagamentoAberto(false)}
        onConfirmar={confirmarVenda}
      />
    </>
  );
}
