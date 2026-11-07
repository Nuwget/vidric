import { notFound } from 'next/navigation';
import { DesignSystemContent } from './_components/design-system-content';

export default function DesignSystemPage() {
  // Ferramenta de dev: em build de produção o NODE_ENV é inlineado e a rota
  // vira um 404 estático. O layout tem o mesmo guard para não vazar o shell.
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  return <DesignSystemContent />;
}