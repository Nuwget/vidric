'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Calculator, Lock, LogOut, Package, Wallet, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { VidricLogo } from '@/components/vidric-logo';
import type { Session } from '@/lib/auth';
import { drawer } from '@/lib/motion';

interface Props {
  session: Session | null;
  aberto: boolean;
  onFechar: () => void;
}

const NAV = [
  { href: '/pdv', rotulo: 'PDV', icone: Calculator, emBreve: false },
  { href: '/estoque', rotulo: 'Estoque', icone: Package, emBreve: false },
  { href: '/estoque/relatorios/parados', rotulo: 'Relatórios', icone: BarChart3, emBreve: false },
  { href: '/financeiro', rotulo: 'Financeiro', icone: Wallet, emBreve: true },
];

export function Sidebar({ session, aberto, onFechar }: Props) {
  const pathname = usePathname();
  // Só o item de prefixo mais específico acende (Relatórios dentro de /estoque).
  const hrefAtivo = NAV.filter(
    (item) => !item.emBreve && (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  ).sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <motion.aside
      id="nav-drawer"
      variants={drawer}
      initial={false}
      animate={aberto ? 'aberto' : 'fechado'}
      className="glass nav-panel fixed inset-y-0 left-0 z-50 w-[280px] md:static md:w-[232px] p-5 flex flex-col"
    >
      <div className="flex items-center justify-between md:justify-start">
        <VidricLogo className="h-8 w-auto" />
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar menu"
          className="md:hidden size-12 grid place-items-center rounded-[calc(var(--radius)*0.6)] text-foreground"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="mt-6 flex flex-col gap-1.5">
        {NAV.map(({ href, rotulo, icone: Icone, emBreve }) => {
          const ativo = !emBreve && href === hrefAtivo;
          if (emBreve) {
            return (
              <span
                key={href}
                aria-disabled="true"
                title="Em breve"
                className="flex items-center gap-2.5 px-3.5 py-3 rounded-[calc(var(--radius)*0.6)] text-sm opacity-[0.62] text-muted-foreground select-none"
              >
                <Icone className="size-4" />
                {rotulo}
                <Lock className="size-3" aria-hidden />
                <span className="ml-auto text-[11px]">em breve</span>
              </span>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              onClick={onFechar}
              aria-current={ativo ? 'page' : undefined}
              className={`flex items-center gap-2.5 px-3.5 py-3 rounded-[calc(var(--radius)*0.6)] text-[15px] no-underline ${
                ativo ? 'font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
              style={
                ativo ? { background: 'var(--accent-soft)', color: 'var(--accent-text)' } : undefined
              }
            >
              <Icone className="size-4" />
              {rotulo}
            </Link>
          );
        })}
      </nav>

      <div
        className="mt-auto pt-4 border-t text-[13px] text-muted-foreground"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        <b className="block font-semibold text-foreground">{session?.nome ?? '—'}</b>
        <span>{session?.papel ?? ''}</span>
      </div>
    </motion.aside>
  );
}

export function BotaoSair({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2.5 min-h-12 rounded-[calc(var(--radius)*0.6)] text-sm font-medium ${className ?? ''}`}
      style={{ border: '1px solid var(--glass-border)', color: 'var(--fg)', background: 'transparent' }}
    >
      <LogOut className="size-4" />
      Sair
    </button>
  );
}
