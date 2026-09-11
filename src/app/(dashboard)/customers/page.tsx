'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore, Customer, CustomerRanking } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Globe, 
  Sparkles,
  UserPlus,
  Trash2,
  Edit,
  History,
  Camera,
  Upload,
  Calendar,
  Building,
  MapPin,
  DollarSign,
  Package,
  FileText,
  Clock,
  CheckCircle2,
  Cake,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { aiCustomerInsights, AICustomerInsightsOutput } from '@/ai/flows/ai-customer-insights';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';

export default function CustomersPage() {
  const { 
    customers, 
    fetchCustomers, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer, 
    hasPermission, 
    currentUser,
    companySettings
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AICustomerInsightsOutput | null>(null);
  
  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCountry, setFormCountry] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formBirthday, setFormBirthday] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [formRanking, setFormRanking] = useState<CustomerRanking>('Normal');
  const [formCustomerId, setFormCustomerId] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const canCreate = hasPermission('customers.create');
  const canEdit = hasPermission('customers.edit');
  const canDelete = hasPermission('customers.delete');
  const canViewLifetime = hasPermission('customers.lifetime_history');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.customerId && c.customerId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const resetForm = () => {
    setFormName('');
    setFormCompanyName('');
    setFormEmail('');
    setFormPhone('');
    setFormCountry('');
    setFormAddress('');
    setFormBirthday('');
    setFormNotes('');
    setFormAvatar('');
    setFormRanking('Normal');
    setFormCustomerId('');
    setSelectedCustomerId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setFormName(customer.name);
    setFormCompanyName(customer.companyName || '');
    setFormEmail(customer.email);
    setFormPhone(customer.phone);
    setFormCountry(customer.country);
    setFormAddress(customer.address || '');
    setFormBirthday(customer.birthday || '');
    setFormNotes(customer.notes || '');
    setFormAvatar(customer.avatar || '');
    setFormRanking(customer.ranking);
    setFormCustomerId(customer.customerId || '');
    setIsEditOpen(true);
  };

  const handleOpenProfile = async (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setIsProfileOpen(true);
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerDetails(data);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to load customer profile details.", variant: "destructive" });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please select an image under 2MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormAvatar(reader.result as string);
        toast({ title: "Image Uploaded", description: "Profile photo set." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCustomer = async () => {
    if (!formName || !formEmail || !formCountry || !formPhone) {
      toast({ title: "Missing Fields", description: "Please fill in all required contact details.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const res = await addCustomer({
      name: formName,
      companyName: formCompanyName,
      email: formEmail,
      phone: formPhone,
      country: formCountry,
      address: formAddress,
      birthday: formBirthday,
      notes: formNotes,
      ranking: formRanking,
      avatar: formAvatar,
      customerId: formCustomerId,
    });
    setIsSaving(false);

    if (res.success) {
      toast({ title: "Customer Added", description: `${formName} has been registered.` });
      setIsAddOpen(false);
      resetForm();
    } else {
      toast({ title: "Error", description: res.error || "Failed to add customer.", variant: "destructive" });
    }
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomerId || !formName || !formEmail || !formCountry || !formPhone) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const res = await updateCustomer(selectedCustomerId, {
      name: formName,
      companyName: formCompanyName,
      email: formEmail,
      phone: formPhone,
      country: formCountry,
      address: formAddress,
      birthday: formBirthday,
      notes: formNotes,
      ranking: formRanking,
      avatar: formAvatar,
      customerId: formCustomerId,
    });
    setIsSaving(false);

    if (res.success) {
      toast({ title: "Profile Updated", description: "Customer changes saved successfully." });
      setIsEditOpen(false);
      resetForm();
    } else {
      toast({ title: "Error", description: res.error || "Failed to update customer.", variant: "destructive" });
    }
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (confirm(`Are you sure you want to delete customer ${customer.name}?`)) {
      const res = await deleteCustomer(customer.id);
      if (res.success) {
        toast({ title: "Customer Removed", description: `${customer.name} was removed.` });
      } else {
        toast({ title: "Error", description: res.error || "Failed to delete customer", variant: "destructive" });
      }
    }
  };

  const handleRunAI = async (customer: Customer) => {
    setAnalyzingId(customer.id);
    setAiResult(null);
    try {
      const result = await aiCustomerInsights({
        customerNotes: customer.notes || '',
        purchaseHistory: []
      });
      setAiResult(result);
    } catch (err) {
      toast({ title: "AI Analysis Failed", description: "Could not reach the AI service.", variant: "destructive" });
    } finally {
      setAnalyzingId(null);
    }
  };

  const getRankBadge = (rank: CustomerRanking) => {
    switch(rank) {
      case 'VVIP': return <Badge className="bg-purple-600 hover:bg-purple-700 font-bold">{rank}</Badge>;
      case 'VIP': return <Badge className="bg-amber-500 hover:bg-amber-600 font-bold">{rank}</Badge>;
      case 'Regular': return <Badge variant="secondary" className="font-bold">{rank}</Badge>;
      default: return <Badge variant="outline">{rank}</Badge>;
    }
  };

  const currencySymbol = companySettings.currency === 'LKR' ? 'Rs. ' : '$';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Customer Management</h1>
          <p className="text-muted-foreground">Manage client relationships, profiles, and lifetime purchasing history.</p>
        </div>
        
        {canCreate && (
          <Button onClick={handleOpenAdd} className="gap-2 shadow-md">
            <UserPlus className="w-4 h-4" />
            Add Customer
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <h3 className="text-3xl font-black text-primary">{customers.filter(c => c.ranking === 'VIP' || c.ranking === 'VVIP').length}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Premium Partners (VIP/VVIP)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <h3 className="text-3xl font-black">{customers.length}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Customers</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <h3 className="text-3xl font-black text-blue-600">{new Set(customers.map(c => c.country)).size}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Countries Represented</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-muted/10 border-b">
          <CardTitle className="text-base font-bold">Customer Directory</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, company, country..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Customer / Company</TableHead>
                <TableHead>Customer ID</TableHead>
                <TableHead>Location & Address</TableHead>
                <TableHead>Contact Details</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="group hover:bg-muted/10 transition-colors">
                  <TableCell>
                    <div 
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => handleOpenProfile(customer)}
                    >
                      <Avatar className="w-10 h-10 border border-primary/10">
                        <AvatarImage src={customer.avatar} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {customer.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                          {customer.name}
                        </span>
                        {customer.companyName && (
                          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                            <Building className="w-3 h-3 text-muted-foreground/70" />
                            {customer.companyName}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">
                      {customer.customerId || 'CUST-0000'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        {customer.country}
                      </div>
                      {customer.address && (
                        <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                          {customer.address}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        {customer.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        {customer.phone}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {getRankBadge(customer.ranking)}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 gap-1 text-primary hover:bg-primary/10 font-bold"
                        onClick={() => handleOpenProfile(customer)}
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Manage</DropdownMenuLabel>
                          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleOpenProfile(customer)}>
                            <History className="w-4 h-4" /> View Profile & History
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleOpenEdit(customer)}>
                              <Edit className="w-4 h-4" /> Edit Details
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleRunAI(customer)}>
                            <Sparkles className="w-4 h-4 text-primary" /> AI Insights
                          </DropdownMenuItem>
                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="gap-2 text-destructive cursor-pointer"
                                onClick={() => handleDeleteCustomer(customer)}
                              >
                                <Trash2 className="w-4 h-4" /> Delete Customer
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                    No customers found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CUSTOMER PROFILE & LIFETIME HISTORY MODAL */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {loadingProfile || !customerDetails ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium text-muted-foreground">Loading customer profile & purchasing history...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <DialogHeader className="border-b pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-2 border-primary/20 shadow-sm">
                      <AvatarImage src={customerDetails.customer.avatar} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                        {customerDetails.customer.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <DialogTitle className="text-2xl font-black text-primary">
                          {customerDetails.customer.name}
                        </DialogTitle>
                        {getRankBadge(customerDetails.customer.ranking)}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {customerDetails.customer.customerId || 'CUST-0000'} • Registered {new Date(customerDetails.customer.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/20 p-4 rounded-xl border">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <Building className="w-3 h-3" /> Company
                  </span>
                  <p className="text-xs font-bold text-foreground">{customerDetails.customer.companyName || 'Individual'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Country & Address
                  </span>
                  <p className="text-xs font-bold text-foreground">{customerDetails.customer.country}</p>
                  {customerDetails.customer.address && (
                    <p className="text-[11px] text-muted-foreground">{customerDetails.customer.address}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <Cake className="w-3 h-3" /> Birthday
                  </span>
                  <p className="text-xs font-bold text-foreground">
                    {customerDetails.customer.birthday || 'Not specified'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </span>
                  <p className="text-xs font-bold text-foreground">{customerDetails.customer.email}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </span>
                  <p className="text-xs font-bold text-foreground">{customerDetails.customer.phone}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Notes</span>
                  <p className="text-xs text-muted-foreground italic truncate">{customerDetails.customer.notes || 'None'}</p>
                </div>
              </div>

              {/* LIFETIME PURCHASE HISTORY SECTION */}
              {canViewLifetime && customerDetails.lifetime ? (
                <div className="space-y-6 pt-2">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-black tracking-tight text-primary">
                        LIFETIME PURCHASE HISTORY
                      </h3>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                      Calculated from real invoices
                    </Badge>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Orders</span>
                      <p className="text-2xl font-black text-primary">{customerDetails.lifetime.totalOrders}</p>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-green-700">Lifetime Value</span>
                      <p className="text-2xl font-black text-green-700">
                        {currencySymbol}{customerDetails.lifetime.totalPurchaseValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Total Paid</span>
                      <p className="text-2xl font-black text-blue-700">
                        {currencySymbol}{customerDetails.lifetime.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Outstanding</span>
                      <p className="text-2xl font-black text-amber-700">
                        {currencySymbol}{customerDetails.lifetime.outstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Purchase Milestones */}
                  <div className="grid grid-cols-2 gap-4 text-xs bg-muted/20 p-3 rounded-lg">
                    <div>
                      <span className="text-muted-foreground font-medium">First Purchase Date: </span>
                      <span className="font-bold text-foreground">
                        {customerDetails.lifetime.firstPurchaseDate ? new Date(customerDetails.lifetime.firstPurchaseDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium">Last Purchase Date: </span>
                      <span className="font-bold text-foreground">
                        {customerDetails.lifetime.lastPurchaseDate ? new Date(customerDetails.lifetime.lastPurchaseDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Tabs: Invoice History vs Products Purchased */}
                  <Tabs defaultValue="invoices" className="space-y-4">
                    <TabsList className="bg-muted/40">
                      <TabsTrigger value="invoices" className="gap-2">
                        <FileText className="w-4 h-4" />
                        Invoice History ({customerDetails.lifetime.invoices.length})
                      </TabsTrigger>
                      <TabsTrigger value="products" className="gap-2">
                        <Package className="w-4 h-4" />
                        Products Purchased ({customerDetails.lifetime.productsPurchased.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="invoices">
                      <div className="border rounded-xl overflow-hidden bg-white">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow>
                              <TableHead>Invoice #</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Products / Line Items</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customerDetails.lifetime.invoices.map((inv: any) => (
                              <TableRow key={inv.id}>
                                <TableCell className="font-mono text-xs font-bold text-primary">{inv.invoiceNumber}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{inv.date}</TableCell>
                                <TableCell className="text-xs">
                                  <div className="space-y-1">
                                    {inv.items.map((item: any, i: number) => (
                                      <div key={i} className="text-[11px] text-foreground">
                                        • {item.quantity}x {item.name} ({currencySymbol}{item.price.toFixed(2)})
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="font-bold text-xs">{currencySymbol}{inv.total.toFixed(2)}</TableCell>
                                <TableCell>
                                  <Badge variant={inv.status === 'Paid' ? 'default' : 'secondary'} className="text-[10px]">
                                    {inv.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                            {customerDetails.lifetime.invoices.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic text-xs">
                                  No invoices on record for this customer.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    <TabsContent value="products">
                      <div className="border rounded-xl overflow-hidden bg-white">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow>
                              <TableHead>Product Name</TableHead>
                              <TableHead>SKU</TableHead>
                              <TableHead>Total Quantity</TableHead>
                              <TableHead>Total Spend</TableHead>
                              <TableHead>Last Ordered</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customerDetails.lifetime.productsPurchased.map((prod: any, i: number) => (
                              <TableRow key={i}>
                                <TableCell className="font-bold text-xs">{prod.productName}</TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">{prod.sku}</TableCell>
                                <TableCell className="font-bold text-xs">{prod.totalQty} units</TableCell>
                                <TableCell className="font-bold text-xs text-primary">{currencySymbol}{prod.totalSpent.toFixed(2)}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{prod.lastOrderDate}</TableCell>
                              </TableRow>
                            ))}
                            {customerDetails.lifetime.productsPurchased.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic text-xs">
                                  No products purchased yet.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : null}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsProfileOpen(false)}>Close Profile</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ADD CUSTOMER MODAL */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Register New Customer
            </DialogTitle>
            <DialogDescription>
              Enter the full profile details for the new buyer or partner.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cust-name">Customer Name *</Label>
                <Input 
                  id="cust-name" 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)} 
                  placeholder="e.g. Klaus Schneider" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cust-company">Company Name</Label>
                <Input 
                  id="cust-company" 
                  value={formCompanyName} 
                  onChange={(e) => setFormCompanyName(e.target.value)} 
                  placeholder="e.g. Bavarian Spice Trading LLC" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cust-email">Work Email *</Label>
                <Input 
                  id="cust-email" 
                  type="email" 
                  value={formEmail} 
                  onChange={(e) => setFormEmail(e.target.value)} 
                  placeholder="klaus@bavariaspice.de" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cust-phone">Phone / WhatsApp *</Label>
                <Input 
                  id="cust-phone" 
                  value={formPhone} 
                  onChange={(e) => setFormPhone(e.target.value)} 
                  placeholder="+49 89 123456" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cust-country">Country *</Label>
                <Input 
                  id="cust-country" 
                  value={formCountry} 
                  onChange={(e) => setFormCountry(e.target.value)} 
                  placeholder="e.g. Germany" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cust-birthday">Birthday</Label>
                <Input 
                  id="cust-birthday" 
                  type="date" 
                  value={formBirthday} 
                  onChange={(e) => setFormBirthday(e.target.value)} 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cust-address">Physical Address</Label>
                <Input 
                  id="cust-address" 
                  value={formAddress} 
                  onChange={(e) => setFormAddress(e.target.value)} 
                  placeholder="Street address, city, postal code" 
                />
              </div>

              <div className="space-y-2">
                <Label>Customer Classification</Label>
                <Select value={formRanking} onValueChange={(v: CustomerRanking) => setFormRanking(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="VVIP">VVIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cust-id">Custom Customer ID (Optional)</Label>
                <Input 
                  id="cust-id" 
                  value={formCustomerId} 
                  onChange={(e) => setFormCustomerId(e.target.value)} 
                  placeholder="Leave empty for auto-generated ID" 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cust-notes">Notes & Shipping Preferences</Label>
                <Textarea 
                  id="cust-notes" 
                  value={formNotes} 
                  onChange={(e) => setFormNotes(e.target.value)} 
                  placeholder="Special moisture requirements, shipping instructions, etc." 
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCustomer} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Save Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT CUSTOMER MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Edit Customer Profile
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-cust-name">Customer Name *</Label>
                <Input 
                  id="edit-cust-name" 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cust-company">Company Name</Label>
                <Input 
                  id="edit-cust-company" 
                  value={formCompanyName} 
                  onChange={(e) => setFormCompanyName(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cust-email">Work Email *</Label>
                <Input 
                  id="edit-cust-email" 
                  type="email" 
                  value={formEmail} 
                  onChange={(e) => setFormEmail(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cust-phone">Phone *</Label>
                <Input 
                  id="edit-cust-phone" 
                  value={formPhone} 
                  onChange={(e) => setFormPhone(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cust-country">Country *</Label>
                <Input 
                  id="edit-cust-country" 
                  value={formCountry} 
                  onChange={(e) => setFormCountry(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cust-birthday">Birthday</Label>
                <Input 
                  id="edit-cust-birthday" 
                  type="date" 
                  value={formBirthday} 
                  onChange={(e) => setFormBirthday(e.target.value)} 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-cust-address">Address</Label>
                <Input 
                  id="edit-cust-address" 
                  value={formAddress} 
                  onChange={(e) => setFormAddress(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label>Classification</Label>
                <Select value={formRanking} onValueChange={(v: CustomerRanking) => setFormRanking(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="VVIP">VVIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cust-id">Customer ID</Label>
                <Input 
                  id="edit-cust-id" 
                  value={formCustomerId} 
                  onChange={(e) => setFormCustomerId(e.target.value)} 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-cust-notes">Notes</Label>
                <Textarea 
                  id="edit-cust-notes" 
                  value={formNotes} 
                  onChange={(e) => setFormNotes(e.target.value)} 
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateCustomer} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
