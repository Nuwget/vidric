'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isSessionExpired, readSession } from '@/lib/auth';
import { rotaInicial } from '@/hooks/useAuth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = readSession();
    router.replace(session && !isSessionExpired(session) ? rotaInicial(session.papel) : '/login');
  }, [router]);

  return null;
}
