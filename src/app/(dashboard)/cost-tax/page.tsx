'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  Coins, 
  TrendingUp, 
  Percent, 
  Package, 
  Truck, 
  Receipt, 
  Building, 
  Plus, 
  Trash2, 
  Save, 
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Lock,
  Loader2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function CostAndTaxPage() {
  const { 
    costTaxData, 
    fetchCostTax, 
    addExpense, 
    deleteExpense, 
    updateCostTaxSettings, 
    currentUser, 
    hasPermission,
    updateProduct,
    fetchProducts
  } = useAppStore();

  const router = useRouter();

  // Settings form state in LKR
  const [taxRate, setTaxRate] = useState<number>(5);
  const [defaultPackagingLKR, setDefaultPackagingLKR] = useState<number>(450);
  const [defaultShippingLKR, setDefaultShippingLKR] = useState<number>(1500);

  // New expense form state in LKR
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<any>('Rent');
  const [expenseAmountLKR, setExpenseAmountLKR] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseNotes, setExpenseNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Edit product cost modal in LKR
  const [isEditProductCostOpen, setIsEditProductCostOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [prodCostLKR, setProdCostLKR] = useState<number>(0);
  const [prodPkgCostLKR, setProdPkgCostLKR] = useState<number>(0);
  const [prodShipCostLKR, setProdShipCostLKR] = useState<number>(0);
  const [prodTaxRate, setProdTaxRate] = useState<number>(0);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.isSuperAdmin;
  const canView = isSuperAdmin || hasPermission('internal_cost.view');
  const canEdit = isSuperAdmin || hasPermission('internal_cost.edit');

  useEffect(() => {
    if (!canView) {
      toast({ title: "Restricted Access", description: "Internal Cost & Tax is private to Super Admin.", variant: "destructive" });
      router.push('/dashboard');
      return;
    }
    fetchCostTax();
    fetchProducts();
  }, [canView, fetchCostTax, fetchProducts, router]);

  useEffect(() => {
    if (costTaxData?.settings) {
      setTaxRate(costTaxData.settings.defaultTaxRatePercent || 5);
      setDefaultPackagingLKR((costTaxData.settings as any).defaultPackagingCostLKR || 450);
      setDefaultShippingLKR((costTaxData.settings as any).defaultShippingCostLKR || 1500);
    }
  }, [costTaxData]);

  if (!canView) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-center">
        <Lock className="w-12 h-12 text-destructive opacity-80" />
        <h2 className="text-xl font-bold">Confidential Section</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Internal costs, tax structures, and profit calculations are restricted to authorized administrators.
        </p>
      </div>
    );
  }

  const handleSaveGlobalSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/cost-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'UPDATE_SETTINGS',
          defaultTaxRatePercent: taxRate,
          defaultPackagingCostLKR: defaultPackagingLKR,
          defaultShippingCostLKR: defaultShippingLKR,
        }),
      });
      setIsSaving(false);
      if (res.ok) {
        toast({ title: "Settings Saved", description: "Global internal cost parameters updated in LKR." });
        fetchCostTax();
      } else {
        toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
      }
    } catch {
      setIsSaving(false);
      toast({ title: "Error", description: "Network error saving settings.", variant: "destructive" });
    }
  };

  const handleAddExpense = async () => {
    if (!expenseTitle || expenseAmountLKR <= 0) {
      toast({ title: "Validation Error", description: "Please enter title and a valid positive amount in LKR.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/cost-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'ADD_EXPENSE',
          title: expenseTitle,
          category: expenseCategory,
          amountLKR: Number(expenseAmountLKR),
          date: expenseDate,
          notes: expenseNotes,
        }),
      });
      setIsSaving(false);

      if (res.ok) {
        toast({ title: "Expense Added", description: `Added "${expenseTitle}" (Rs. ${expenseAmountLKR.toLocaleString()}) to operating overhead.` });
        setIsAddExpenseOpen(false);
        setExpenseTitle('');
        setExpenseAmountLKR(0);
        setExpenseNotes('');
        fetchCostTax();
      } else {
        toast({ title: "Error", description: "Failed to record expense.", variant: "destructive" });
      }
    } catch {
      setIsSaving(false);
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm('Delete this expense record?')) {
      const success = await deleteExpense(id);
      if (success) {
        toast({ title: "Expense Removed", description: "Operating expense deleted." });
      }
    }
  };

  const handleOpenProductCost = (prod: any) => {
    setSelectedProduct(prod);
    setProdCostLKR(prod.costLKR || 0);
    setProdPkgCostLKR(prod.packagingCostLKR || 0);
    setProdShipCostLKR(prod.shippingCostLKR || 0);
    setProdTaxRate(prod.taxRatePercent || 0);
    setIsEditProductCostOpen(true);
  };

  const handleSaveProductCost = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    const res = await updateProduct(selectedProduct.id, {
      costLKR: Number(prodCostLKR),
      costUSD: Number(prodCostLKR) / 300,
      packagingCostUSD: Number(prodPkgCostLKR) / 300,
      shippingCostUSD: Number(prodShipCostLKR) / 300,
      taxRatePercent: Number(prodTaxRate),
    });
    setIsSaving(false);

    if (res.success) {
      toast({ title: "Cost Updated", description: `COGS updated for ${selectedProduct.name} in LKR.` });
      setIsEditProductCostOpen(false);
      fetchCostTax();
    } else {
      toast({ title: "Error", description: res.error || "Failed to update product cost.", variant: "destructive" });
    }
  };

  const metrics = costTaxData?.profitMetrics || {
    totalRevenueLKR: 0,
    totalCOGSLKR: 0,
    totalPackagingCostLKR: 0,
    totalShippingCostLKR: 0,
    totalOverheadExpensesLKR: 0,
    totalTaxCollectedLKR: 0,
    grossProfitLKR: 0,
    netProfitLKR: 0,
    grossMarginPercent: 0,
    netProfitMarginPercent: 0,
  } as any;

  const totalRev = metrics.totalRevenueLKR !== undefined ? metrics.totalRevenueLKR : (metrics.totalRevenueUSD * 300);
  const totalCOGS = metrics.totalCOGSLKR !== undefined ? metrics.totalCOGSLKR : (metrics.totalCOGSUSD * 300);
  const totalOverhead = (metrics.totalOverheadExpensesLKR !== undefined ? metrics.totalOverheadExpensesLKR : (metrics.totalOverheadExpensesUSD * 300)) + 
    (metrics.totalPackagingCostLKR !== undefined ? metrics.totalPackagingCostLKR : (metrics.totalPackagingCostUSD * 300)) +
    (metrics.totalShippingCostLKR !== undefined ? metrics.totalShippingCostLKR : (metrics.totalShippingCostUSD * 300));
  const netProfit = metrics.netProfitLKR !== undefined ? metrics.netProfitLKR : (metrics.netProfitUSD * 300);
  const totalTax = metrics.totalTaxCollectedLKR !== undefined ? metrics.totalTaxCollectedLKR : (metrics.totalTaxCollectedUSD * 300);

  const expenses = costTaxData?.settings.expenses || [];
  const productsCost = costTaxData?.productsCostData || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-primary">Internal Cost & Tax Engine</h1>
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase">
              Confidential (LKR)
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Manage COGS, packaging & shipping expenses, tax liabilities, and real-time net profit margins in Sri Lankan Rupee (LKR).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button onClick={() => setIsAddExpenseOpen(true)} className="gap-2 shadow-md">
              <Plus className="w-4 h-4" />
              Add Overhead Expense (LKR)
            </Button>
          )}
        </div>
      </div>

      {/* PROFIT & REVENUE CARDS (ALL IN LKR) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Revenue (LKR)</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black mt-2 text-foreground">
              Rs. {totalRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1">Across all completed customer orders</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total COGS (Product Cost)</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-amber-600 mt-2">
              Rs. {totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1">Direct production / raw material cost</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Operating Overhead (LKR)</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Building className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-purple-600 mt-2">
              Rs. {totalOverhead.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1">Rent, labor, packaging & logistics</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-primary text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">Net Profit (LKR)</span>
              <div className="p-2 bg-white/10 text-white rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black mt-2">
              Rs. {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center gap-1 text-[11px] opacity-90 mt-1">
              <span>Margin: </span>
              <span className="font-bold">{metrics.netProfitMarginPercent}%</span>
              <span>• Gross: {metrics.grossMarginPercent}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Product Unit COGS & Profit Margins in LKR */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-muted/10 border-b py-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Product COGS & Profit Margin Breakdown (LKR)
              </CardTitle>
              <CardDescription>Internal cost per unit and calculated profit per SKU in Sri Lankan Rupees.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Product / SKU</TableHead>
                  <TableHead className="text-right">Selling Price (LKR)</TableHead>
                  <TableHead className="text-right">Unit COGS (LKR)</TableHead>
                  <TableHead className="text-right">Packaging (LKR)</TableHead>
                  <TableHead className="text-right">Unit Profit</TableHead>
                  <TableHead className="text-right">Margin %</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsCost.map((prod) => {
                  const price = prod.priceLKR || prod.priceUSD * 300;
                  const cost = prod.costLKR || prod.costUSD * 300;
                  const pkg = prod.packagingCostLKR || prod.packagingCostUSD * 300;
                  const unitProfit = price - cost - pkg;
                  const marginPercent = price > 0 ? Math.round((unitProfit / price) * 1000) / 10 : 0;

                  return (
                    <TableRow key={prod.id} className="hover:bg-muted/10">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs">{prod.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">{prod.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs">Rs. {price.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold text-xs text-amber-600">Rs. {cost.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">Rs. {pkg.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold text-xs text-green-600">Rs. {unitProfit.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={marginPercent > 35 ? 'default' : 'secondary'} className="text-[10px] font-bold">
                          {marginPercent}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canEdit && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs font-bold text-primary hover:bg-primary/10"
                            onClick={() => handleOpenProductCost(prod)}
                          >
                            Edit Cost
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {productsCost.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground italic text-xs">
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Right Column: Global Tax & Logistics Cost Defaults in LKR */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="py-4 border-b bg-muted/10">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                Cost & Tax Parameters (LKR)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="tax-rate" className="text-xs font-bold uppercase tracking-tight flex items-center justify-between">
                  <span>Export Tax / VAT Rate (%)</span>
                  <span className="text-primary font-mono">{taxRate}%</span>
                </Label>
                <Input 
                  id="tax-rate" 
                  type="number" 
                  step="0.1" 
                  value={taxRate} 
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pkg-cost" className="text-xs font-bold uppercase tracking-tight flex items-center justify-between">
                  <span>Default Packaging Cost (Rs. / unit)</span>
                  <span className="text-primary font-mono">Rs. {defaultPackagingLKR.toLocaleString()}</span>
                </Label>
                <Input 
                  id="pkg-cost" 
                  type="number" 
                  step="50" 
                  value={defaultPackagingLKR} 
                  onChange={(e) => setDefaultPackagingLKR(parseFloat(e.target.value) || 0)} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ship-cost" className="text-xs font-bold uppercase tracking-tight flex items-center justify-between">
                  <span>Default Shipping Base (Rs.)</span>
                  <span className="text-primary font-mono">Rs. {defaultShippingLKR.toLocaleString()}</span>
                </Label>
                <Input 
                  id="ship-cost" 
                  type="number" 
                  step="100" 
                  value={defaultShippingLKR} 
                  onChange={(e) => setDefaultShippingLKR(parseFloat(e.target.value) || 0)} 
                />
              </div>

              {canEdit && (
                <Button onClick={handleSaveGlobalSettings} disabled={isSaving} className="w-full gap-2 mt-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Cost Parameters (LKR)
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary/5 border border-primary/10">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Tax Liability Collected
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <p className="text-2xl font-black text-primary">
                Rs. {totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground">
                Total export tax and duties accrued from customer billings in LKR.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* OPERATING OVERHEAD EXPENSES TABLE IN LKR */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-muted/10 border-b py-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              Internal Operating Expenses & Overhead Log (LKR)
            </CardTitle>
            <CardDescription>Recurring and one-off business operational expenses factored into profit.</CardDescription>
          </div>
          {canEdit && (
            <Button size="sm" onClick={() => setIsAddExpenseOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Expense (LKR)
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Expense Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Amount (LKR)</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((exp: any) => {
                const amount = exp.amountLKR !== undefined ? exp.amountLKR : (exp.amountUSD ? exp.amountUSD * 300 : 0);
                return (
                  <TableRow key={exp.id} className="hover:bg-muted/10">
                    <TableCell className="text-xs text-muted-foreground">{exp.date}</TableCell>
                    <TableCell className="font-bold text-xs">{exp.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {exp.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{exp.notes || '-'}</TableCell>
                    <TableCell className="text-right font-black text-xs text-primary">Rs. {amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">
                      {canEdit && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteExpense(exp.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {expenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic text-xs">
                    No operating expenses logged yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ADD EXPENSE MODAL IN LKR */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Overhead Expense (LKR)</DialogTitle>
            <DialogDescription>Add a facility, labor, or operating expense in Sri Lankan Rupees.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="exp-title">Expense Title *</Label>
              <Input 
                id="exp-title" 
                value={expenseTitle} 
                onChange={(e) => setExpenseTitle(e.target.value)} 
                placeholder="e.g. Warehouse Port Lease / Electricity" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rent">Rent</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Labor">Labor</SelectItem>
                    <SelectItem value="Logistics">Logistics</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exp-amount">Amount (Rs. LKR) *</Label>
                <Input 
                  id="exp-amount" 
                  type="number" 
                  value={expenseAmountLKR || ''} 
                  onChange={(e) => setExpenseAmountLKR(parseFloat(e.target.value) || 0)} 
                  placeholder="e.g. 540000" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-date">Date</Label>
              <Input 
                id="exp-date" 
                type="date" 
                value={expenseDate} 
                onChange={(e) => setExpenseDate(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-notes">Notes</Label>
              <Input 
                id="exp-notes" 
                value={expenseNotes} 
                onChange={(e) => setExpenseNotes(e.target.value)} 
                placeholder="Optional notes or invoice ref..." 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>Cancel</Button>
            <Button onClick={handleAddExpense} disabled={isSaving}>Record Expense (LKR)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT PRODUCT COGS MODAL IN LKR */}
      <Dialog open={isEditProductCostOpen} onOpenChange={setIsEditProductCostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Product COGS: {selectedProduct?.name}</DialogTitle>
            <DialogDescription>Set unit production, packaging, and tax parameters in Sri Lankan Rupees (LKR).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted/40 rounded-lg text-xs flex justify-between">
              <span>Public Selling Price:</span>
              <span className="font-bold text-primary">Rs. {(selectedProduct?.priceLKR || (selectedProduct?.priceUSD || 0) * 300).toLocaleString()}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cogs-val">Unit Cost of Goods Sold (COGS in Rs. LKR) *</Label>
              <Input 
                id="cogs-val" 
                type="number" 
                step="50" 
                value={prodCostLKR} 
                onChange={(e) => setProdCostLKR(parseFloat(e.target.value) || 0)} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pkg-val">Packaging Cost Per Unit (Rs. LKR)</Label>
              <Input 
                id="pkg-val" 
                type="number" 
                step="10" 
                value={prodPkgCostLKR} 
                onChange={(e) => setProdPkgCostLKR(parseFloat(e.target.value) || 0)} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ship-val">Estimated Unit Shipping Cost (Rs. LKR)</Label>
              <Input 
                id="ship-val" 
                type="number" 
                step="50" 
                value={prodShipCostLKR} 
                onChange={(e) => setProdShipCostLKR(parseFloat(e.target.value) || 0)} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax-val">Product-Specific Tax Rate (%)</Label>
              <Input 
                id="tax-val" 
                type="number" 
                step="0.1" 
                value={prodTaxRate} 
                onChange={(e) => setProdTaxRate(parseFloat(e.target.value) || 0)} 
              />
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-green-800 font-medium">Estimated Unit Profit (LKR):</span>
                <span className="font-black text-green-800">
                  Rs. {Math.max(0, (selectedProduct?.priceLKR || (selectedProduct?.priceUSD || 0) * 300) - prodCostLKR - prodPkgCostLKR).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-800 font-medium">Estimated Margin:</span>
                <span className="font-black text-green-800">
                  {(selectedProduct?.priceLKR || selectedProduct?.priceUSD * 300) > 0 
                    ? Math.round((((selectedProduct?.priceLKR || selectedProduct?.priceUSD * 300) - prodCostLKR - prodPkgCostLKR) / (selectedProduct?.priceLKR || selectedProduct?.priceUSD * 300)) * 100) 
                    : 0}%
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProductCostOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProductCost} disabled={isSaving}>Save Product Cost (LKR)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
