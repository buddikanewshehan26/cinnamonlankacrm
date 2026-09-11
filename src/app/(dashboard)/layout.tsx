'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, checkAuth, authChecked, fetchDashboardData, fetchSettings } = useAppStore();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function init() {
      const isValid = await checkAuth();
      if (!isValid) {
        router.push('/login');
      } else {
        await Promise.allSettled([
          fetchDashboardData(),
          fetchSettings(),
        ]);
        if (isMounted) setLoading(false);
      }
    }

    init();

    // Heartbeat check every 15 seconds to ensure disabled users immediately lose access
    const interval = setInterval(async () => {
      const stillValid = await checkAuth();
      if (!stillValid) {
        router.push('/login');
      }
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [checkAuth, fetchDashboardData, fetchSettings, router]);

  if (loading || !authChecked || !currentUser) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Initializing CRM Portal...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="w-64 flex-shrink-0">
        <Sidebar />
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
