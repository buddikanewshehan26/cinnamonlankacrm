'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore, Invoice, Product, Customer } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Download, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  PackagePlus, 
  FileText, 
  Image as ImageIcon,
  FileDown,
  Edit,
  Search,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cn } from '@/lib/utils';

export default function InvoicesPage() {
  const { 
    invoices, 
    customers, 
    products, 
    fetchInvoices, 
    fetchCustomers, 
    fetchProducts, 
    addInvoice, 
    updateInvoiceStatus, 
    deleteInvoice, 
    companySettings,
    hasPermission 
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const defaultLogo = PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl || '';

  const isLKR = companySettings.currency === 'LKR';
  const currencySymbol = isLKR ? 'Rs. ' : '$';

  // Permissions
  const canCreate = hasPermission('invoices.create');
  const canEdit = hasPermission('invoices.edit');
  const canDelete = hasPermission('invoices.delete');

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchProducts();
  }, [fetchInvoices, fetchCustomers, fetchProducts]);

  // New Invoice State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [tax, setTax] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [discount, setDiscount] = useState(0);

  const subtotal = useMemo(() => {
    return invoiceItems.reduce((acc, item) => {
      const product = products.find(p => p.id === item.productId);
      const price = isLKR ? (product?.priceLKR || 0) : (product?.priceUSD || 0);
      return acc + price * item.quantity;
    }, 0);
  }, [invoiceItems, products, isLKR]);

  const discountAmount = useMemo(() => {
    return (subtotal * discount) / 100;
  }, [subtotal, discount]);

  const total = useMemo(() => {
    return subtotal - discountAmount + tax + shipping;
  }, [subtotal, discountAmount, tax, shipping]);

  const handleAddItem = () => {
    setInvoiceItems([...invoiceItems, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: any) => {
    const newItems = [...invoiceItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvoiceItems(newItems);
  };

  const handleCreateInvoice = async () => {
    if (!selectedCustomerId || invoiceItems.length === 0 || invoiceItems.some(i => !i.productId)) {
      toast({ title: "Validation Error", description: "Please select a customer and products.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const items = invoiceItems.map(item => {
      const product = products.find(p => p.id === item.productId)!;
      const price = isLKR ? product.priceLKR : product.priceUSD;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: price
      };
    });

    const res = await addInvoice({
      customerId: selectedCustomerId,
      date: new Date().toISOString().split('T')[0],
      items,
      tax,
      shipping,
      discount,
      total,
      currency: isLKR ? 'LKR' : 'USD',
      status: 'Pending'
    });
    setIsSaving(false);

    if (res.success) {
      toast({ title: "Invoice Created", description: "The new invoice has been generated successfully." });
      setIsCreateOpen(false);
      resetForm();
    } else {
      toast({ title: "Error", description: res.error || "Failed to create invoice.", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setInvoiceItems([]);
    setTax(0);
    setShipping(0);
    setDiscount(0);
  };

  const toggleStatus = async (invId: string, current: 'Paid' | 'Pending') => {
    if (!canEdit) {
      toast({ title: "Permission Denied", description: "Read-only access. You cannot modify invoice payment status.", variant: "destructive" });
      return;
    }
    const nextStatus = current === 'Paid' ? 'Pending' : 'Paid';
    const success = await updateInvoiceStatus(invId, nextStatus);
    if (success) {
      toast({ title: "Status Updated", description: `Invoice marked as ${nextStatus}.` });
    }
  };

  const handleDelete = async (inv: Invoice) => {
    if (!canDelete) {
      toast({ title: "Permission Denied", description: "You do not have permission to delete invoices.", variant: "destructive" });
      return;
    }
    if (confirm(`Are you sure you want to delete invoice ${inv.invoiceNumber}? Stock will be restored.`)) {
      const success = await deleteInvoice(inv.id);
      if (success) {
        toast({ title: "Invoice Deleted", description: "Invoice removed and stock restored." });
      }
    }
  };

  const downloadJPG = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `invoice-${previewInvoice?.invoiceNumber}.jpg`;
      link.click();
      toast({ title: "Export Success", description: "Invoice saved as JPG." });
    } catch (error) {
      toast({ title: "Export Error", description: "Failed to generate image.", variant: "destructive" });
    }
  };

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`invoice-${previewInvoice?.invoiceNumber}.pdf`);
      toast({ title: "Export Success", description: "Invoice saved as PDF." });
    } catch (error) {
      toast({ title: "Export Error", description: "Failed to generate PDF.", variant: "destructive" });
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const customer = customers.find(c => c.id === inv.customerId);
    return (
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer && customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const InvoiceDisplay = ({ invoice }: { invoice: Invoice }) => {
    const customer = customers.find(c => c.id === invoice.customerId);
    const invSubtotal = invoice.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const invDiscountVal = (invSubtotal * invoice.discount) / 100;
    const invCurrencySymbol = invoice.currency === 'LKR' ? 'Rs. ' : '$';

    return (
      <div ref={invoiceRef} className="bg-white p-12 border rounded-lg shadow-sm text-foreground space-y-12 max-w-[800px] mx-auto overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 relative bg-white rounded-xl shadow-sm border p-1 overflow-hidden">
              <Image src={companySettings.logo || defaultLogo} alt="Logo" fill className="object-contain" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary tracking-tight">{companySettings.name}</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{companySettings.address}</p>
              <div className="mt-1 flex gap-4 text-[10px] text-muted-foreground font-medium">
                <span>Hotline: {companySettings.hotline}</span>
                <span>Email: {companySettings.email}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-black uppercase tracking-tighter opacity-20">Invoice</h1>
            <p className="font-mono text-sm mt-1 font-bold">{invoice.invoiceNumber}</p>
            <p className="text-xs text-muted-foreground font-medium">{invoice.date}</p>
          </div>
        </div>

        {/* Bill To */}
        <div className="grid grid-cols-2 gap-8 border-t pt-8">
          <div>
            <h3 className="text-[10px] font-bold uppercase text-muted-foreground mb-2 tracking-[0.2em]">Bill To / Ship To:</h3>
            <p className="font-bold text-xl text-foreground">{customer?.name}</p>
            {customer?.companyName && <p className="text-xs font-bold text-muted-foreground">{customer.companyName}</p>}
            <div className="mt-2 space-y-0.5 text-xs text-muted-foreground font-medium">
              <p>{customer?.country}</p>
              <p>{customer?.email}</p>
              <p>{customer?.phone}</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <h3 className="text-[10px] font-bold uppercase text-muted-foreground mb-2 tracking-[0.2em]">Payment Status:</h3>
            <div className={cn(
              "px-5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-[0.1em]",
              invoice.status === 'Paid' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
            )}>
              {invoice.status}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-4 pt-4">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-primary/20 hover:bg-transparent">
                <TableHead className="font-black text-primary h-10 text-xs uppercase">Description / SKU</TableHead>
                <TableHead className="text-right font-black text-primary h-10 w-28 text-xs uppercase">Unit Price</TableHead>
                <TableHead className="text-right font-black text-primary h-10 w-20 text-xs uppercase">Qty</TableHead>
                <TableHead className="text-right font-black text-primary h-10 w-32 text-xs uppercase">Total ({invoice.currency})</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, i) => {
                const product = products.find(p => p.id === item.productId);
                return (
                  <TableRow key={i} className="hover:bg-transparent border-b border-muted/50">
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-foreground">{product?.name || 'Item'}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{product?.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4 text-xs font-medium">{invCurrencySymbol}{item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right py-4 text-xs font-medium">{item.quantity}</TableCell>
                    <TableCell className="text-right py-4 text-xs font-black">{invCurrencySymbol}{(item.price * item.quantity).toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="flex justify-end pt-4">
          <div className="w-80 space-y-2 border-t-2 border-primary/10 pt-4 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground uppercase text-[10px] font-bold">Subtotal:</span>
              <span className="font-bold">{invCurrencySymbol}{invSubtotal.toFixed(2)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-accent font-bold">
                <span className="uppercase text-[10px]">Discount ({invoice.discount}%):</span>
                <span>-{invCurrencySymbol}{invDiscountVal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground uppercase text-[10px] font-bold">Tax:</span>
              <span className="font-bold">{invCurrencySymbol}{invoice.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground uppercase text-[10px] font-bold">Shipping:</span>
              <span className="font-bold">{invCurrencySymbol}{invoice.shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t font-black text-primary text-base">
              <span className="uppercase tracking-tight">Grand Total:</span>
              <span>{invCurrencySymbol}{invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Invoices & Billing</h1>
          <p className="text-muted-foreground">Issue export billing and manage payment transactions.</p>
        </div>
        
        {canCreate && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-md">
                <Plus className="w-4 h-4" />
                Create New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Export Invoice</DialogTitle>
                <DialogDescription>Fill in customer and product items to generate an invoice.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label>Recipient Customer *</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.country})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold">Line Items</Label>
                    <Button variant="outline" size="sm" onClick={handleAddItem} className="gap-2">
                      <PackagePlus className="w-4 h-4" /> Add Product
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {invoiceItems.map((item, index) => (
                      <div key={index} className="flex gap-3 items-end">
                        <div className="flex-1 space-y-1">
                          <Label className="text-[10px] uppercase">Product</Label>
                          <Select 
                            value={item.productId} 
                            onValueChange={(v) => handleItemChange(index, 'productId', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku}) - {currencySymbol}{isLKR ? p.priceLKR.toLocaleString() : p.priceUSD}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-24 space-y-1">
                          <Label className="text-[10px] uppercase">Qty</Label>
                          <Input 
                            type="number" 
                            min="1"
                            value={item.quantity} 
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)} 
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t pt-6">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase">Tax ({currencySymbol})</Label>
                    <Input type="number" value={tax} onChange={(e) => setTax(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase">Shipping ({currencySymbol})</Label>
                    <Input type="number" value={shipping} onChange={(e) => setShipping(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-accent font-bold">Discount (%)</Label>
                    <Input 
                      type="number" 
                      value={discount} 
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} 
                    />
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-accent font-bold">
                      <span>Discount ({discount}%):</span>
                      <span>-{currencySymbol}{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{currencySymbol}{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>{currencySymbol}{shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-primary border-t pt-2 mt-2">
                    <span>Total Amount:</span>
                    <span>{currencySymbol}{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateInvoice} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Finalize & Save Invoice'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by invoice number or customer..." 
            className="pl-10 h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-muted/10 border-b">
          <CardTitle className="text-base font-bold">Invoicing History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv) => {
                const customer = customers.find(c => c.id === inv.customerId);
                const invCurrencySymbol = inv.currency === 'LKR' ? 'Rs. ' : '$';
                return (
                  <TableRow key={inv.id} className="hover:bg-muted/5 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-primary">{inv.invoiceNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{customer?.name || 'Unknown'}</span>
                        <span className="text-[10px] text-muted-foreground">{customer?.country}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{inv.date}</TableCell>
                    <TableCell className="text-xs text-accent font-medium">
                      {inv.discount > 0 ? `${inv.discount}%` : '-'}
                    </TableCell>
                    <TableCell className="font-bold text-xs text-primary">{invCurrencySymbol}{inv.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <button 
                        onClick={() => toggleStatus(inv.id, inv.status)}
                        disabled={!canEdit}
                        title={canEdit ? "Click to toggle payment status" : "Read-only access"}
                      >
                        <Badge 
                          variant={inv.status === 'Paid' ? 'default' : 'secondary'}
                          className={cn("flex items-center gap-1 text-[10px]", canEdit ? "cursor-pointer" : "cursor-default")}
                        >
                          {inv.status === 'Paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {inv.status}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => setPreviewInvoice(inv)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Invoice Preview</DialogTitle>
                            </DialogHeader>
                            {previewInvoice && (
                              <div className="space-y-6">
                                <InvoiceDisplay invoice={previewInvoice} />
                                <div className="flex justify-center gap-4 py-4">
                                  <Button onClick={downloadPDF} className="gap-2 bg-red-600 hover:bg-red-700">
                                    <FileText className="w-4 h-4" /> Download PDF
                                  </Button>
                                  <Button onClick={downloadJPG} className="gap-2 bg-blue-600 hover:bg-blue-700">
                                    <ImageIcon className="w-4 h-4" /> Download JPG
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {canDelete && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(inv)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic text-xs">
                    No invoices recorded.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
