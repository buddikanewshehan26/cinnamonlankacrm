'use client';

import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { currentUser, checkAuth } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const isValid = await checkAuth();
      if (isValid) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
    init();
  }, [checkAuth, router]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-3">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading CinnamonLink Pro...</p>
    </div>
  );
}
