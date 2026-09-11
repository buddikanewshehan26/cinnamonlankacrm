'use client';

import { useState, useEffect } from 'react';
import { useAppStore, Product } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Warehouse, ArrowUpDown, RotateCcw, Plus, AlertTriangle, Loader2, DollarSign, Boxes } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

export default function InventoryPage() {
  const { products, fetchProducts, adjustStock, hasPermission, currentUser } = useAppStore();
  
  // Refill State
  const [isRefillOpen, setIsRefillOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [refillQuantity, setRefillQuantity] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reconciliation State
  const [isReconOpen, setIsReconOpen] = useState(false);
  const [reconProductId, setReconProductId] = useState<string>('');
  const [reconNewStock, setReconNewStock] = useState<number>(0);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const canCreate = hasPermission('inventory.create');
  const canEdit = hasPermission('inventory.edit');

  const handleRefill = async () => {
    if (!selectedProduct || refillQuantity <= 0) {
      toast({ title: "Invalid Quantity", description: "Please enter a positive number to refill.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const res = await adjustStock(selectedProduct.id, 'REFILL', refillQuantity);
    setIsSubmitting(false);

    if (res.success) {
      toast({ 
        title: "Stock Refilled", 
        description: `Added ${refillQuantity} units to ${selectedProduct.name}. New total: ${selectedProduct.stock + refillQuantity}` 
      });
      setIsRefillOpen(false);
      setSelectedProduct(null);
      setRefillQuantity(0);
    } else {
      toast({ title: "Error", description: res.error || "Failed to refill stock", variant: "destructive" });
    }
  };

  const handleReconciliation = async () => {
    if (!reconProductId) {
      toast({ title: "Select Product", description: "Please select a product to reconcile.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const res = await adjustStock(reconProductId, 'RECONCILE', reconNewStock);
    setIsSubmitting(false);

    if (res.success) {
      const productName = products.find(p => p.id === reconProductId)?.name;
      toast({ 
        title: "Stock Reconciled", 
        description: `${productName} stock has been manually set to ${reconNewStock} units.` 
      });
      setIsReconOpen(false);
      setReconProductId('');
      setReconNewStock(0);
    } else {
      toast({ title: "Error", description: res.error || "Failed to reconcile stock", variant: "destructive" });
    }
  };

  const lowStockProducts = products.filter(p => p.stock <= p.lowStockThreshold);
  const totalInventoryValue = products.reduce((sum, p) => sum + p.stock * p.priceUSD, 0);
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Warehouse className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Stock Management</h1>
            <p className="text-muted-foreground">Live inventory levels and warehouse tracking.</p>
          </div>
        </div>
        
        {canEdit && (
          <Dialog open={isReconOpen} onOpenChange={setIsReconOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-md" variant="outline">
                <RotateCcw className="w-4 h-4" />
                Stock Reconciliation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manual Stock Reconciliation</DialogTitle>
                <DialogDescription>
                  Correct discrepancies by manually overriding the current physical stock count.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Product</Label>
                  <Select value={reconProductId} onValueChange={setReconProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-stock">Current Actual Physical Count</Label>
                  <Input 
                    id="new-stock" 
                    type="number" 
                    value={reconNewStock} 
                    onChange={(e) => setReconNewStock(parseInt(e.target.value) || 0)} 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleReconciliation} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Warehouse Record'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-primary text-primary-foreground">
          <CardContent className="p-6 flex items-center justify-between"><div><p className="text-xs font-bold uppercase opacity-80">Total Inventory Value</p><p className="text-3xl font-black mt-2">${totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p><p className="text-xs mt-2 opacity-80">Based on USD pricing</p></div><DollarSign className="w-9 h-9 opacity-70" /></CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex items-center justify-between"><div><p className="text-xs font-bold uppercase text-muted-foreground">Total Units in Stock</p><p className="text-3xl font-black mt-2">{totalUnits.toLocaleString()}</p><p className="text-xs mt-2 text-muted-foreground">Across {products.length} products</p></div><Boxes className="w-9 h-9 text-primary/50" /></CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex items-center justify-between"><div><p className="text-xs font-bold uppercase text-muted-foreground">Critical Stock Alerts</p><p className="text-3xl font-black mt-2 text-destructive">{lowStockProducts.length}</p><p className="text-xs mt-2 text-muted-foreground">{lowStockProducts.length ? 'Needs attention' : 'Warehouse healthy'}</p></div><AlertTriangle className="w-9 h-9 text-destructive/60" /></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm lg:col-span-3 overflow-hidden bg-white">
          <CardHeader className="pb-4 border-b bg-muted/10">
            <CardTitle className="text-base font-bold">Warehouse Inventory Matrix</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Product / SKU</TableHead>
                  <TableHead>Current Level</TableHead>
                  <TableHead>Capacity Usage</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const capacity = p.maxStockCapacity || 1000; 
                  const usage = (p.stock / capacity) * 100;
                  const isLow = p.stock <= p.lowStockThreshold;
                  
                  return (
                    <TableRow key={p.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{p.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">{p.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "font-black text-base",
                          isLow ? "text-accent" : "text-primary"
                        )}>
                          {p.stock} <span className="text-[10px] font-normal text-muted-foreground uppercase">units</span>
                        </span>
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        <div className="space-y-1">
                          <Progress value={usage} className={cn("h-2", isLow ? "bg-accent/20" : "bg-primary/20")} />
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">
                            {usage.toFixed(1)}% OF {capacity} UNIT CAPACITY
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isLow ? 'destructive' : 'default'} className="text-[10px] uppercase font-bold px-2 py-0.5">
                          {isLow ? 'Low Stock' : 'Healthy'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canCreate && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 gap-1 hover:bg-primary/5 text-primary font-bold"
                            onClick={() => {
                              setSelectedProduct(p);
                              setIsRefillOpen(true);
                            }}
                          >
                            Refill <Plus className="w-3 h-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className={cn(
            "border-none shadow-sm transition-all",
            lowStockProducts.length > 0 ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
          )}>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Warehouse className="w-4 h-4" />
                Live Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lowStockProducts.map(p => (
                <div key={p.id} className="p-3 bg-white/10 rounded-lg text-xs flex items-start gap-2 border border-white/20">
                  <div className="w-2 h-2 rounded-full bg-white shrink-0 mt-1 animate-pulse" />
                  <div>
                    <p className="font-bold uppercase tracking-tight">{p.name}</p>
                    <p className="opacity-80">Critical: Only {p.stock} units remain. Restock immediately.</p>
                  </div>
                </div>
              ))}
              {lowStockProducts.length === 0 && (
                <div className="py-4 text-center">
                  <p className="text-sm opacity-90 italic">All stock levels are healthy.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Refill Dialog */}
      <Dialog open={isRefillOpen} onOpenChange={setIsRefillOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restock Product</DialogTitle>
            <DialogDescription>
              Increase warehouse units for <span className="font-bold text-primary">{selectedProduct?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-[10px] uppercase text-muted-foreground">Current Stock</Label>
                <p className="text-xl font-bold">{selectedProduct?.stock} units</p>
              </div>
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <Label className="text-[10px] uppercase text-primary">Target Stock</Label>
                <p className="text-xl font-bold text-primary">{(selectedProduct?.stock || 0) + refillQuantity} units</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refill-qty">Quantity to Add</Label>
              <Input 
                id="refill-qty" 
                type="number" 
                placeholder="Enter units..." 
                value={refillQuantity || ''} 
                onChange={(e) => setRefillQuantity(parseInt(e.target.value) || 0)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefillOpen(false)}>Cancel</Button>
            <Button onClick={handleRefill} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Addition'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
