import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/guards';
import { getDB } from '@/server/db';
import { hasPermission } from '@/lib/permissions';

export async function GET(req: Request) {
  const auth = await authenticateRequest(req, 'reports.view');
  if ('errorResponse' in auth) return auth.errorResponse;

  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || 'lifetime'; // 'today' | 'week' | 'month' | 'year' | 'custom' | 'lifetime'
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const db = await getDB();
  const now = new Date();

  // Helper date filter
  const filterByDate = (dateStr: string) => {
    if (!dateStr) return false;
    if (range === 'lifetime') return true;
    
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;

    if (range === 'today') {
      return d.toISOString().split('T')[0] === now.toISOString().split('T')[0];
    }
    if (range === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return d >= oneWeekAgo && d <= now;
    }
    if (range === 'month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    if (range === 'year') {
      return d.getFullYear() === now.getFullYear();
    }
    if (range === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    }
    return true;
  };

  const filteredInvoices = db.invoices.filter(inv => filterByDate(inv.date));

  const totalSalesCount = filteredInvoices.length;
  const paidInvoices = filteredInvoices.filter(i => i.status === 'Paid');
  const pendingInvoices = filteredInvoices.filter(i => i.status === 'Pending');

  const totalRevenue = filteredInvoices.reduce((sum, i) => sum + i.total, 0);
  const totalPaidRevenue = paidInvoices.reduce((sum, i) => sum + i.total, 0);
  const totalOutstanding = pendingInvoices.reduce((sum, i) => sum + i.total, 0);
  const totalTax = filteredInvoices.reduce((sum, i) => sum + (i.tax || 0), 0);

  // Check if user is allowed to view internal costs and profits
  const canViewCost = auth.user.role === 'SUPER_ADMIN' || hasPermission(auth.user, 'internal_cost.view');

  let costData = null;
  if (canViewCost) {
    let totalCOGS = 0;
    let totalPackaging = 0;
    let totalShipping = 0;

    filteredInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const prod = db.products.find(p => p.id === item.productId);
        totalCOGS += (prod?.costUSD || item.costUSD || 0) * item.quantity;
        totalPackaging += (prod?.packagingCostUSD || db.costTaxSettings.defaultPackagingCostUSD || 0) * item.quantity;
        totalShipping += (prod?.shippingCostUSD || 0) * item.quantity;
      });
    });

    const overhead = db.costTaxSettings.expenses.filter(e => filterByDate(e.date)).reduce((s, e) => s + e.amountUSD, 0);
    const netProfit = totalRevenue - totalCOGS - totalPackaging - totalShipping - overhead;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    costData = {
      totalCOGS,
      totalPackaging,
      totalShipping,
      overhead,
      netProfit,
      profitMargin: Math.round(profitMargin * 10) / 10,
    };
  }

  // Best selling products in range
  const productSalesMap: { [prodId: string]: { name: string; sku: string; unitsSold: number; revenue: number } } = {};
  filteredInvoices.forEach(inv => {
    inv.items.forEach(item => {
      const prod = db.products.find(p => p.id === item.productId);
      const name = prod?.name || 'Item';
      const sku = prod?.sku || '';
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name, sku, unitsSold: 0, revenue: 0 };
      }
      productSalesMap[item.productId].unitsSold += item.quantity;
      productSalesMap[item.productId].revenue += item.quantity * item.price;
    });
  });

  const bestSellingProducts = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Country breakdown
  const countryMap: { [country: string]: { orders: number; revenue: number } } = {};
  filteredInvoices.forEach(inv => {
    const cust = db.customers.find(c => c.id === inv.customerId);
    const country = cust?.country || 'Unknown';
    if (!countryMap[country]) {
      countryMap[country] = { orders: 0, revenue: 0 };
    }
    countryMap[country].orders += 1;
    countryMap[country].revenue += inv.total;
  });

  const countryBreakdown = Object.entries(countryMap).map(([country, stats]) => ({
    country,
    orders: stats.orders,
    revenue: stats.revenue,
    percent: totalRevenue > 0 ? Math.round((stats.revenue / totalRevenue) * 100) : 0,
  })).sort((a, b) => b.revenue - a.revenue);

  return NextResponse.json({
    range,
    summary: {
      totalSalesCount,
      paidInvoicesCount: paidInvoices.length,
      pendingInvoicesCount: pendingInvoices.length,
      totalRevenue,
      totalPaidRevenue,
      totalOutstanding,
      totalTax,
      totalCustomers: db.customers.length,
      totalProducts: db.products.length,
      lowStockProductsCount: db.products.filter(p => p.stock <= p.lowStockThreshold).length,
    },
    costMetrics: costData,
    bestSellingProducts,
    countryBreakdown,
    invoices: filteredInvoices.map(i => {
      const cust = db.customers.find(c => c.id === i.customerId);
      return {
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        customerName: cust?.name || 'Unknown',
        country: cust?.country || '',
        date: i.date,
        total: i.total,
        status: i.status,
        itemsCount: i.items.length,
      };
    }),
  });
}
