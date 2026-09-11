'use client';

import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  FileText 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { customers, products, invoices, companySettings, currentUser, hasPermission } = useAppStore();

  const isLKR = companySettings.currency === 'LKR';
  const currencySymbol = isLKR ? 'Rs. ' : '$';

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const lowStockCount = products.filter(p => p.stock <= p.lowStockThreshold).length;
  const recentInvoices = [...invoices].reverse().slice(0, 5);

  const canCreateInvoice = hasPermission('invoices.create');
  const canViewReports = hasPermission('reports.view');

  const stats = [
    { title: 'Total Customers', value: customers.length, icon: Users, color: 'text-blue-600', trend: '+12%' },
    { title: 'Total Sales', value: invoices.length, icon: FileText, color: 'text-primary', trend: '+5%' },
    { title: `Revenue (${companySettings.currency})`, value: `${currencySymbol}${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-green-600', trend: '+8.2%' },
    { title: 'Stock Alerts', value: lowStockCount, icon: AlertTriangle, color: 'text-accent', trend: lowStockCount > 0 ? 'Urgent' : 'All clear' },
  ];

  const chartData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 2000 },
    { name: 'Apr', revenue: 2780 },
    { name: 'May', revenue: 1890 },
    { name: 'Jun', revenue: 2390 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">{companySettings.name}</h1>
          <p className="text-muted-foreground">
            Welcome back, <span className="font-bold text-foreground">{currentUser?.name}</span> ({currentUser?.position || currentUser?.role}).
          </p>
        </div>
        <div className="flex gap-3">
          {canViewReports && (
            <Link href="/reports">
              <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
                <TrendingUp className="w-4 h-4" />
                Intelligence & Reports
              </Button>
            </Link>
          )}
          {canCreateInvoice && (
            <Link href="/invoices">
              <Button className="gap-2 shadow-lg">
                <Plus className="w-4 h-4" />
                New Invoice
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="shadow-sm border-none bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg bg-muted/50 ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className={cn(
                    "flex items-center text-xs font-medium",
                    stat.trend.startsWith('+') ? "text-green-600" : "text-accent"
                  )}>
                    {stat.trend}
                    {stat.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3 ml-1" /> : null}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-base font-bold">Revenue Trend (Export Volume)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <Tooltip 
                    cursor={{ fill: '#f5f5f5' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 5 ? 'hsl(var(--accent))' : 'hsl(var(--primary))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-base font-bold">Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentInvoices.length > 0 ? recentInvoices.map((inv) => (
                <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold font-mono text-primary">{inv.invoiceNumber}</p>
                    <p className="text-[11px] text-muted-foreground">{inv.date}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-xs font-bold">{currencySymbol}{inv.total.toFixed(2)}</p>
                    <span className={cn(
                      "text-[9px] uppercase font-bold px-2 py-0.5 rounded-full",
                      inv.status === 'Paid' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-muted-foreground italic text-xs">
                  Waiting for new export orders...
                </div>
              )}
            </div>
            {recentInvoices.length > 0 && (
              <div className="p-3 border-t">
                <Link href="/invoices">
                  <Button variant="ghost" className="w-full text-xs text-primary hover:bg-primary/5 font-bold h-8">
                    View Invoices
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
