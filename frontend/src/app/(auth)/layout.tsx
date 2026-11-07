import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-8 bg-background">
      {children}
    </main>
  );
}
