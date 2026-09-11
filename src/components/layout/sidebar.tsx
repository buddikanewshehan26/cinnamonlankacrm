'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  History, 
  BarChart3, 
  Settings, 
  LogOut,
  Warehouse,
  ShieldCheck,
  Calculator,
  UserCog
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function Sidebar() {
  const pathname = usePathname();
  const { logout, currentUser, companySettings, hasPermission } = useAppStore();
  const defaultLogo = PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl || '';

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.isSuperAdmin;

  // Dynamically filtered navigation items
  const mainNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, perm: 'dashboard.view' },
    { name: 'Customers', href: '/customers', icon: Users, perm: 'customers.view' },
    { name: 'Products', href: '/products', icon: Package, perm: 'products.view' },
    { name: 'Inventory', href: '/inventory', icon: Warehouse, perm: 'inventory.view' },
    { name: 'Invoices', href: '/invoices', icon: FileText, perm: 'invoices.view' },
    { name: 'Sales History', href: '/sales', icon: History, perm: 'invoices.view' },
    { name: 'Reports', href: '/reports', icon: BarChart3, perm: 'reports.view' },
  ].filter(item => isSuperAdmin || hasPermission(item.perm));

  // Protected Admin / Cost & Tax navigation items
  const adminNavItems = [
    { name: 'Internal Cost & Tax', href: '/cost-tax', icon: Calculator, perm: 'internal_cost.view' },
    { name: 'Staff Management', href: '/admin', icon: UserCog, perm: 'staff.view' },
    { name: 'Business Profile', href: '/settings', icon: Settings, perm: 'business_profile.view' },
  ].filter(item => isSuperAdmin || hasPermission(item.perm));

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border text-sidebar-foreground">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-12 h-12 relative bg-white rounded-xl flex items-center justify-center p-1 shadow-sm border border-primary/10 overflow-hidden shrink-0">
            <Image 
              src={companySettings.logo || defaultLogo} 
              alt={companySettings.name} 
              width={44} 
              height={44} 
              className="object-contain"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-xs font-bold leading-tight tracking-tight truncate">{companySettings.name}</h1>
            <span className="text-[9px] uppercase font-bold text-primary tracking-tighter opacity-80 shrink-0">
              {isSuperAdmin ? 'Super Admin Portal' : `${currentUser?.position || 'Staff'} Portal`}
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {mainNavItems.length > 0 && (
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-40 px-3 py-2">
            Operations
          </div>
        )}
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group text-sm",
                isActive 
                  ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "" : "opacity-70 group-hover:opacity-100")} />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {adminNavItems.length > 0 && (
          <>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-40 px-3 py-2 mt-6">
              Administration & Finance
            </div>
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group text-sm",
                    isActive 
                      ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "" : "opacity-70 group-hover:opacity-100")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-sidebar-border mt-auto">
        <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-sidebar-accent/30 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold overflow-hidden border">
            {currentUser?.avatar ? (
              <Image src={currentUser.avatar} alt={currentUser.name} width={32} height={32} className="object-cover h-full w-full" />
            ) : (
              currentUser?.name?.charAt(0) || 'U'
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold truncate">{currentUser?.name}</span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 bg-primary/10 text-primary font-bold rounded">
                {currentUser?.position || currentUser?.role}
              </span>
            </div>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 h-9"
          onClick={logout}
        >
          <LogOut className="w-4 h-4" />
          <span className="text-xs font-bold">Sign Out</span>
        </Button>
      </div>
    </div>
  );
}
