'use client';

import { useState, useEffect } from 'react';
import { useAppStore, Product } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  Filter, 
  Edit, 
  Trash2, 
  BarChart2, 
  Layers,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from '@/hooks/use-toast';

export default function ProductsPage() {
  const { 
    products, 
    fetchProducts, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    companySettings, 
    hasPermission 
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formPriceUSD, setFormPriceUSD] = useState<number>(0);
  const [formPriceLKR, setFormPriceLKR] = useState<number>(0);
  const [formStock, setFormStock] = useState<number>(100);
  const [formCapacity, setFormCapacity] = useState<number>(1000);
  const [formThreshold, setFormThreshold] = useState<number>(20);
  const [formImage, setFormImage] = useState('');

  const handleImageUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Image too large', description: 'Please use an image smaller than 2 MB.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFormImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const canCreate = hasPermission('products.create');
  const canEdit = hasPermission('products.edit');
  const canDelete = hasPermission('products.delete');

  const isLKR = companySettings.currency === 'LKR';
  const currencySymbol = isLKR ? 'Rs. ' : '$';

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormName('');
    setFormCategory('');
    setFormSku('');
    setFormPriceUSD(0);
    setFormPriceLKR(0);
    setFormStock(100);
    setFormCapacity(1000);
    setFormThreshold(20);
    setFormImage('');
    setSelectedProductId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setSelectedProductId(prod.id);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormSku(prod.sku);
    setFormPriceUSD(prod.priceUSD);
    setFormPriceLKR(prod.priceLKR);
    setFormStock(prod.stock);
    setFormCapacity(prod.maxStockCapacity);
    setFormThreshold(prod.lowStockThreshold);
    setFormImage(prod.image);
    setIsEditOpen(true);
  };

  const handleAdd = async () => {
    if (!formName || !formSku || formPriceUSD <= 0) {
      toast({ title: "Validation Error", description: "Name, SKU, and valid Price USD are required.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const res = await addProduct({
      name: formName,
      category: formCategory || 'Premium',
      sku: formSku,
      priceUSD: Number(formPriceUSD),
      priceLKR: Number(formPriceLKR) || Number(formPriceUSD) * 300,
      stock: Number(formStock),
      maxStockCapacity: Number(formCapacity),
      lowStockThreshold: Number(formThreshold),
      image: formImage || `https://picsum.photos/seed/${encodeURIComponent(formSku)}/400/400`,
    });
    setIsSaving(false);

    if (res.success) {
      toast({ title: "Product Created", description: `${formName} added to catalog.` });
      setIsAddOpen(false);
      resetForm();
    } else {
      toast({ title: "Error", description: res.error || "Failed to create product.", variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!selectedProductId || !formName || !formSku) {
      toast({ title: "Validation Error", description: "Name and SKU are required.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const res = await updateProduct(selectedProductId, {
      name: formName,
      category: formCategory,
      sku: formSku,
      priceUSD: Number(formPriceUSD),
      priceLKR: Number(formPriceLKR) || Number(formPriceUSD) * 300,
      stock: Number(formStock),
      maxStockCapacity: Number(formCapacity),
      lowStockThreshold: Number(formThreshold),
      image: formImage,
    });
    setIsSaving(false);

    if (res.success) {
      toast({ title: "Product Updated", description: "Product details saved." });
      setIsEditOpen(false);
      resetForm();
    } else {
      toast({ title: "Error", description: res.error || "Failed to update product.", variant: "destructive" });
    }
  };

  const handleDelete = async (prod: Product) => {
    if (confirm(`Are you sure you want to delete ${prod.name}?`)) {
      const res = await deleteProduct(prod.id);
      if (res.success) {
        toast({ title: "Product Deleted", description: "Product removed from catalog." });
      } else {
        toast({ title: "Error", description: res.error || "Failed to delete product.", variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Product Catalog</h1>
          <p className="text-muted-foreground">Manage SKUs, export pricing, and catalog listings.</p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <Button onClick={handleOpenAdd} className="gap-2 shadow-md">
              <Plus className="w-4 h-4" />
              New Product
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search SKU, name, or category..." 
            className="pl-10 h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-muted/10 border-b">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            Products & Pricing Matrix
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Product Code (SKU)</TableHead>
                <TableHead>Stock Units</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead className="text-right">Price ({companySettings.currency})</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stockPercentage = (product.stock / (product.maxStockCapacity || 1000)) * 100;
                const isLowStock = product.stock <= product.lowStockThreshold;
                const displayPrice = isLKR ? product.priceLKR : product.priceUSD;
                
                return (
                  <TableRow key={product.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell>
                      <div className="w-12 h-12 relative rounded-md overflow-hidden border bg-muted">
                        <Image 
                          src={product.image || 'https://picsum.photos/seed/placeholder/200/200'} 
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{product.name}</span>
                        <Badge variant="outline" className="w-fit text-[10px] mt-0.5 uppercase opacity-80">
                          {product.category}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-bold text-primary">{product.sku}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "font-bold text-sm",
                          isLowStock ? "text-accent" : "text-foreground"
                        )}>
                          {product.stock}
                        </span>
                        {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-accent" />}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[180px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase">
                          <span>Capacity</span>
                          <span>{Math.round(stockPercentage)}%</span>
                        </div>
                        <Progress 
                          value={stockPercentage} 
                          className={cn(
                            "h-1.5",
                            stockPercentage < 20 ? "bg-accent/20" : "bg-primary/20"
                          )} 
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-primary">{currencySymbol}{displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {isLKR ? `$${product.priceUSD.toFixed(2)}` : `Rs. ${product.priceLKR.toLocaleString()}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canEdit && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            onClick={() => handleOpenEdit(product)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(product)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ADD PRODUCT MODAL */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Create a new inventory SKU and set export pricing.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="p-name">Product Name *</Label>
                <Input id="p-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Alba Cinnamon C5" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-sku">Product Code / SKU *</Label>
                <Input id="p-sku" value={formSku} onChange={(e) => setFormSku(e.target.value)} placeholder="e.g. CIN-ALB-01" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-cat">Category</Label>
                <Input id="p-cat" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} placeholder="e.g. Premium Sticks" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-price-usd">Price USD ($) *</Label>
                <Input id="p-price-usd" type="number" step="0.1" value={formPriceUSD || ''} onChange={(e) => setFormPriceUSD(parseFloat(e.target.value) || 0)} placeholder="25.50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-price-lkr">Price LKR (Rs.)</Label>
                <Input id="p-price-lkr" type="number" value={formPriceLKR || ''} onChange={(e) => setFormPriceLKR(parseFloat(e.target.value) || 0)} placeholder="7650" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-stock">Initial Stock (Units)</Label>
                <Input id="p-stock" type="number" value={formStock || ''} onChange={(e) => setFormStock(parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-cap">Max Warehouse Capacity</Label>
                <Input id="p-cap" type="number" value={formCapacity || ''} onChange={(e) => setFormCapacity(parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-thresh">Low Stock Alert Threshold</Label>
                <Input id="p-thresh" type="number" value={formThreshold || ''} onChange={(e) => setFormThreshold(parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="p-image">Product Image</Label>
                <Input id="p-image" type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0])} />
                {formImage && <img src={formImage} alt="Product preview" className="h-20 w-20 rounded-md border object-cover" />}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT PRODUCT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product: {formName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-p-name">Product Name *</Label>
                <Input id="edit-p-name" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-p-sku">SKU Code *</Label>
                <Input id="edit-p-sku" value={formSku} onChange={(e) => setFormSku(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-p-cat">Category</Label>
                <Input id="edit-p-cat" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-p-price-usd">Price USD ($) *</Label>
                <Input id="edit-p-price-usd" type="number" step="0.1" value={formPriceUSD} onChange={(e) => setFormPriceUSD(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-p-price-lkr">Price LKR (Rs.)</Label>
                <Input id="edit-p-price-lkr" type="number" value={formPriceLKR} onChange={(e) => setFormPriceLKR(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-p-stock">Stock</Label>
                <Input id="edit-p-stock" type="number" value={formStock} onChange={(e) => setFormStock(parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-p-cap">Capacity</Label>
                <Input id="edit-p-cap" type="number" value={formCapacity} onChange={(e) => setFormCapacity(parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-p-thresh">Low Stock Threshold</Label>
                <Input id="edit-p-thresh" type="number" value={formThreshold} onChange={(e) => setFormThreshold(parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-p-image">Product Image</Label>
                <Input id="edit-p-image" type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0])} />
                {formImage && <img src={formImage} alt="Product preview" className="h-20 w-20 rounded-md border object-cover" />}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
