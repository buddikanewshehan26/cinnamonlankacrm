'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { summarizeReport } from '@/ai/flows/ai-report-summaries';
import { 
  BarChart3, 
  FileDown, 
  Sparkles, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Users, 
  Package, 
  Clock, 
  Globe, 
  ShieldCheck, 
  Percent,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ReportsPage() {
  const { hasPermission, currentUser } = useAppStore();
  const [range, setRange] = useState<string>('lifetime');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const canExport = hasPermission('reports.export');
  const canViewCost = currentUser?.role === 'SUPER_ADMIN' || currentUser?.isSuperAdmin || hasPermission('internal_cost.view');

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      let url = `/api/reports?range=${range}`;
      if (range === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to load report analytics.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [range, startDate, endDate]);

  const generateAISummary = async () => {
    if (!reportData) return;
    setSummarizing(true);
    try {
      const summaryPayload = `
        Executive Business Analytics Report (${range.toUpperCase()})
        Total Revenue: $${reportData.summary.totalRevenue}
        Total Sales: ${reportData.summary.totalSalesCount}
        Paid Revenue: $${reportData.summary.totalPaidRevenue}
        Outstanding Balance: $${reportData.summary.totalOutstanding}
        Total Active Customers: ${reportData.summary.totalCustomers}
        Best Selling Product: ${reportData.bestSellingProducts?.[0]?.name || 'N/A'} (${reportData.bestSellingProducts?.[0]?.unitsSold || 0} units)
        Top Export Destination: ${reportData.countryBreakdown?.[0]?.country || 'N/A'}
        ${canViewCost && reportData.costMetrics ? `Net Profit: $${reportData.costMetrics.netProfit} (Margin: ${reportData.costMetrics.profitMargin}%)` : ''}
      `;
      const result = await summarizeReport({ reportText: summaryPayload });
      setAiSummary(result.summary);
    } catch (err) {
      toast({ title: "AI Summary Error", description: "Could not generate AI summary.", variant: "destructive" });
    } finally {
      setSummarizing(false);
    }
  };

  const exportToExcel = () => {
    if (!canExport) {
      toast({ title: "Permission Denied", description: "You do not have permission to export reports.", variant: "destructive" });
      return;
    }
    if (!reportData) return;

    try {
      const wb = XLSX.utils.book_new();

      // Invoices sheet
      const wsInvoices = XLSX.utils.json_to_sheet(reportData.invoices || []);
      XLSX.utils.book_append_sheet(wb, wsInvoices, "Invoices");

      // Products sheet
      const wsProducts = XLSX.utils.json_to_sheet(reportData.bestSellingProducts || []);
      XLSX.utils.book_append_sheet(wb, wsProducts, "Top Products");

      // Countries sheet
      const wsCountries = XLSX.utils.json_to_sheet(reportData.countryBreakdown || []);
      XLSX.utils.book_append_sheet(wb, wsCountries, "Export Destinations");

      XLSX.writeFile(wb, `CinnamonLink_Report_${range}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast({ title: "Export Complete", description: "Report exported successfully." });
    } catch (err) {
      toast({ title: "Export Error", description: "Failed to export Excel report.", variant: "destructive" });
    }
  };

  const summary = reportData?.summary || {
    totalSalesCount: 0,
    paidInvoicesCount: 0,
    pendingInvoicesCount: 0,
    totalRevenue: 0,
    totalPaidRevenue: 0,
    totalOutstanding: 0,
    totalTax: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockProductsCount: 0,
  };

  const costMetrics = reportData?.costMetrics;
  const bestProducts = reportData?.bestSellingProducts || [];
  const countries = reportData?.countryBreakdown || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Intelligence & Reports</h1>
          <p className="text-muted-foreground">Historical analytics, sales performance, and lifetime business tracking.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Filter */}
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-44 h-10 bg-white">
              <Calendar className="w-4 h-4 mr-2 text-primary" />
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lifetime">Lifetime Historical</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {range === 'custom' && (
            <div className="flex items-center gap-2">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 bg-white w-36" />
              <span className="text-xs text-muted-foreground font-bold">to</span>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 bg-white w-36" />
            </div>
          )}

          {canExport && (
            <Button className="gap-2 shadow-md" onClick={exportToExcel}>
              <FileDown className="w-4 h-4" />
              Export Report
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Compiling analytics for {range}...</p>
        </div>
      ) : (
        <>
          {/* Top Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Revenue</span>
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-green-700 mt-2">
                  ${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1">{summary.totalSalesCount} total invoices</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Received Payments</span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-blue-700 mt-2">
                  ${summary.totalPaidRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1">{summary.paidInvoicesCount} paid invoices</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending / Outstanding</span>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-amber-700 mt-2">
                  ${summary.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1">{summary.pendingInvoicesCount} pending invoices</p>
              </CardContent>
            </Card>

            {canViewCost && costMetrics ? (
              <Card className="border-none shadow-sm bg-primary text-primary-foreground">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-80">Net Profit</span>
                    <div className="p-2 bg-white/10 text-white rounded-lg">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black mt-2">
                    ${costMetrics.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <p className="text-[11px] opacity-90 mt-1">
                    Margin: {costMetrics.profitMargin}% (COGS: ${costMetrics.totalCOGS.toFixed(0)})
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customers & Leads</span>
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-primary mt-2">{summary.totalCustomers}</h3>
                  <p className="text-[11px] text-muted-foreground mt-1">{summary.totalProducts} active products</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top Products */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="py-4 border-b bg-muted/10">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Top Selling Products
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bestProducts.map((p: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>
                          <span className="font-bold text-xs">{p.name}</span>
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold">{p.unitsSold}</TableCell>
                        <TableCell className="text-right text-xs font-black text-primary">${p.revenue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {bestProducts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground italic text-xs">
                          No sales in selected range.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Top Destinations */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="py-4 border-b bg-muted/10">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Export Destinations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {countries.map((c: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>
                          <span className="font-bold text-xs">{c.country}</span>
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold">{c.orders}</TableCell>
                        <TableCell className="text-right text-xs font-bold text-primary">{c.percent}%</TableCell>
                      </TableRow>
                    ))}
                    {countries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground italic text-xs">
                          No country data in selected range.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* AI Executive Summary */}
            <Card className="border-none shadow-sm bg-primary/5 border border-primary/10 flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between py-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI Executive Summary
                </CardTitle>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-white text-xs h-7" 
                  onClick={generateAISummary}
                  disabled={summarizing}
                >
                  {summarizing ? 'Analyzing...' : 'Refresh AI'}
                </Button>
              </CardHeader>
              <CardContent className="flex-1 p-4">
                {aiSummary ? (
                  <div className="prose prose-sm text-muted-foreground text-xs leading-relaxed">
                    <p className="whitespace-pre-wrap">{aiSummary}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-6 text-center space-y-2">
                    <Sparkles className="w-8 h-8 text-primary opacity-60" />
                    <h4 className="font-bold text-xs text-primary">Automated Intelligence</h4>
                    <p className="text-[11px] text-muted-foreground max-w-xs">
                      Generate an executive briefing on revenue velocity, buyer concentration, and profit performance.
                    </p>
                    <Button variant="link" className="text-xs h-auto p-0 text-primary font-bold" onClick={generateAISummary}>
                      Click to Generate Summary
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
