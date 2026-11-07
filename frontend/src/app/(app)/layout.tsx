'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Sidebar, BotaoSair } from '@/components/layout/sidebar';
import { CaixaStatusBanner } from '@/components/layout/caixa-status-banner';
import { useAuth } from '@/hooks/useAuth';
import { useMinhaLoja } from '@/hooks/useLoja';

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { session, carregando, logout } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const ehLoja = session !== null && session.papel !== 'SuperAdmin';
  const { data: loja } = useMinhaLoja(ehLoja);

  useEffect(() => {
    if (!carregando && !session) router.replace('/login');
  }, [carregando, session, router]);

  if (carregando || !session) return null;

  const ehSuperAdmin = session.papel === 'SuperAdmin';

  return (
    <div className="h-dvh grid grid-cols-1 md:grid-cols-[232px_1fr] gap-[18px] p-3 md:p-[18px]">
      <Sidebar session={session} aberto={menuAberto} onFechar={() => setMenuAberto(false)} />

      <AnimatePresence>
        {menuAberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuAberto(false)}
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-hidden
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3.5 min-w-0 min-h-0">
        {ehSuperAdmin ? (
          <header className="glass flex items-center gap-2.5 px-4 py-3">
            <span className="font-semibold">Vidric</span>
            <span className="text-sm text-muted-foreground ml-0.5">{session.nome}</span>
            <BotaoSair onClick={logout} className="ml-auto" />
          </header>
        ) : (
          <Header
            nomeLoja={loja?.nome ?? null}
            nomeUsuario={session.nome}
            onAbrirMenu={() => setMenuAberto(true)}
            onSair={logout}
          />
        )}

        <CaixaStatusBanner habilitado={ehLoja} />

        <main className="flex-1 min-h-0 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
