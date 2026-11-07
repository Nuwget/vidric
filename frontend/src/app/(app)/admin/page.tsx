'use client';

import { motion } from 'framer-motion';
import { VidricLogo } from '@/components/vidric-logo';
import { entradaPagina } from '@/lib/motion';

export default function AdminPage() {
  return (
    <motion.section
      variants={entradaPagina}
      initial="initial"
      animate="animate"
      className="glass p-8 flex flex-col items-center gap-4 text-center"
    >
      <VidricLogo className="h-10 w-auto" />
      <h1 className="text-2xl font-semibold tracking-tight">Painel Super Admin</h1>
      <p className="text-muted-foreground">Em desenvolvimento (Fase 5).</p>
    </motion.section>
  );
}
