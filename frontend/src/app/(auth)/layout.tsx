import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    // sem bg-background: o mesh do body precisa aparecer atrás do card de login
    <main className="min-h-dvh flex items-center justify-center px-4 py-8">
      {children}
    </main>
  );
}
