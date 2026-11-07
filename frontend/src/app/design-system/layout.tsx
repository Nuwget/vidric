import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DesignSystemShell } from './_components/design-system-shell';

export const metadata: Metadata = {
  title: 'Design System — Vidric (dev)',
  robots: { index: false, follow: false },
};

export default function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  return <DesignSystemShell>{children}</DesignSystemShell>;
}