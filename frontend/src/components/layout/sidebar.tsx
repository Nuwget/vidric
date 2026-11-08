'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Calculator, Lock, LogOut, Package, Wallet, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { VidricLogo } from '@/components/vidric-logo';
import type { Session } from '@/lib/auth';
import { drawer } from '@/lib/motion';

interface SubItem {
  href: string;
  rotulo: string;
}

interface Props {
  session: Session | null;
  aberto: boolean;
  onFechar: () => void;
}

const NAV = [
  { href: '/pdv', rotulo: 'PDV', icone: Calculator, emBreve: false, sub: [] as SubItem[] },
  { href: '/estoque', rotulo: 'Estoque', icone: Package, emBreve: false, sub: [] as SubItem[] },
  { href: '/estoque/relatorios/parados', rotulo: 'Relatórios', icone: BarChart3, emBreve: false, sub: [] as SubItem[] },
  {
    href: '/financeiro',
    rotulo: 'Financeiro',
    icone: Wallet,
    emBreve: false,
    sub: [
      { href: '/financeiro', rotulo: 'Dashboard' },
      { href: '/financeiro/a-receber', rotulo: 'A Receber' },
      { href: '/financeiro/fluxo-caixa', rotulo: 'Fluxo de Caixa' },
    ] as SubItem[],
  },
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
        {NAV.map(({ href, rotulo, icone: Icone, emBreve, sub }) => {
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
            <div key={href} className="flex flex-col gap-0.5">
              <Link
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
              {sub.length > 0 &&
                ativo &&
                sub.map((item) => {
                  const subAtivo = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onFechar}
                      aria-current={subAtivo ? 'page' : undefined}
                      data-testid={`submenu-${item.rotulo.toLowerCase().replace(/\s+/g, '-')}`}
                      className={`flex items-center gap-2.5 pl-10 pr-3.5 py-2 rounded-[calc(var(--radius)*0.6)] text-[13px] no-underline ${
                        subAtivo ? 'font-semibold' : 'text-muted-foreground hover:text-foreground'
                      }`}
                      style={
                        subAtivo ? { color: 'var(--accent-text)' } : undefined
                      }
                    >
                      {item.rotulo}
                    </Link>
                  );
                })}
            </div>
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
