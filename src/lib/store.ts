import { create } from 'zustand';
import { StaffPosition, AccountStatus, UserRole, ALL_PERMISSIONS } from './permissions';

export type CustomerRanking = 'Normal' | 'Regular' | 'VIP' | 'VVIP';
export type CurrencyType = 'USD' | 'LKR';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  position?: StaffPosition;
  role: UserRole;
  isSuperAdmin?: boolean;
  status: AccountStatus;
  permissions: string[];
  avatar?: string;
  createdAt?: string;
  lastLogin?: string | null;
}

export interface CompanySettings {
  name: string;
  address: string;
  hotline: string;
  email: string;
  website?: string;
  logo: string;
  primaryColor: string;
  currency: CurrencyType;
}

export interface LifetimeStats {
  totalOrders: number;
  totalPurchaseValue: number;
  totalPaid: number;
  outstandingAmount: number;
  firstPurchaseDate: string | null;
  lastPurchaseDate: string | null;
  invoiceCount: number;
}

export interface Customer {
  id: string;
  customerId?: string;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  country: string;
  address?: string;
  birthday?: string;
  notes: string;
  ranking: CustomerRanking;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  lifetimeStats?: LifetimeStats | null;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  priceUSD: number;
  priceLKR: number;
  costUSD?: number;
  costLKR?: number;
  packagingCostUSD?: number;
  shippingCostUSD?: number;
  taxRatePercent?: number;
  image: string;
  stock: number;
  maxStockCapacity: number;
  lowStockThreshold: number;
  createdAt?: string;
}

export interface InvoiceItem {
  productId: string;
  quantity: number;
  price: number;
  costUSD?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  date: string;
  items: InvoiceItem[];
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: CurrencyType;
  status: 'Paid' | 'Pending';
  createdAt?: string;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amountUSD: number;
  date: string;
  notes?: string;
}

export interface CostTaxData {
  settings: {
    defaultTaxRatePercent: number;
    defaultPackagingCostUSD: number;
    defaultShippingCostUSD: number;
    expenses: Expense[];
  };
  productsCostData: any[];
  profitMetrics: {
    totalRevenueUSD: number;
    totalCOGSUSD: number;
    totalPackagingCostUSD: number;
    totalShippingCostUSD: number;
    totalOverheadExpensesUSD: number;
    totalTaxCollectedUSD: number;
    grossProfitUSD: number;
    netProfitUSD: number;
    grossMarginPercent: number;
    netProfitMarginPercent: number;
  };
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  target: string;
  details: string;
  prevValue?: any;
  newValue?: any;
  timestamp: string;
}

interface AppStore {
  currentUser: User | null;
  staffList: User[];
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  companySettings: CompanySettings;
  auditLogs: AuditLog[];
  costTaxData: CostTaxData | null;
  isLoading: boolean;
  authChecked: boolean;

  // Permissions helper
  hasPermission: (permissionKey: string) => boolean;

  // Session & Auth
  checkAuth: () => Promise<boolean>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateMyPassword: (newPassword: string) => Promise<boolean>;
  updateProfile: (data: { name?: string; avatar?: string; phone?: string }) => Promise<boolean>;

  // Data Fetching
  fetchDashboardData: () => Promise<void>;
  fetchStaff: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  fetchCostTax: () => Promise<void>;
  fetchAuditLogs: () => Promise<void>;

  // Staff Management
  createStaff: (data: Partial<User> & { password: string }) => Promise<{ success: boolean; error?: string }>;
  updateStaff: (id: string, data: Partial<User> & { password?: string }) => Promise<{ success: boolean; error?: string }>;
  deleteStaff: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleStaffStatus: (id: string, currentStatus: AccountStatus) => Promise<boolean>;

  // Customer Management
  addCustomer: (data: Partial<Customer>) => Promise<{ success: boolean; customer?: Customer; error?: string }>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<{ success: boolean; error?: string }>;
  deleteCustomer: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Product Management
  addProduct: (data: Partial<Product>) => Promise<{ success: boolean; product?: Product; error?: string }>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Inventory
  adjustStock: (productId: string, actionType: 'REFILL' | 'RECONCILE', quantity: number) => Promise<{ success: boolean; error?: string }>;

  // Invoices
  addInvoice: (data: Partial<Invoice>) => Promise<{ success: boolean; invoice?: Invoice; error?: string }>;
  updateInvoiceStatus: (id: string, status: 'Paid' | 'Pending') => Promise<boolean>;
  deleteInvoice: (id: string) => Promise<boolean>;

  // Company Settings
  updateCompanySettings: (data: Partial<CompanySettings>) => Promise<boolean>;

  // Cost & Tax
  addExpense: (data: Omit<Expense, 'id'>) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;
  updateCostTaxSettings: (data: { defaultTaxRatePercent?: number; defaultPackagingCostUSD?: number; defaultShippingCostUSD?: number }) => Promise<boolean>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  currentUser: null,
  staffList: [],
  customers: [],
  products: [],
  invoices: [],
  auditLogs: [],
  costTaxData: null,
  companySettings: {
    name: 'Cinnamon Lanka Exports',
    address: 'No. 123, Galle Road, Colombo 03, Sri Lanka',
    hotline: '+94 11 234 5678',
    email: 'info@cinnamonlanka.com',
    website: 'https://cinnamonlanka.com',
    logo: '',
    primaryColor: '20 50% 47%',
    currency: 'USD',
  },
  isLoading: false,
  authChecked: false,

  hasPermission: (permissionKey: string) => {
    const { currentUser } = get();
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN' || currentUser.isSuperAdmin) return true;
    return Array.isArray(currentUser.permissions) && currentUser.permissions.includes(permissionKey);
  },

  checkAuth: async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          set({ currentUser: data.user, authChecked: true });
          return true;
        }
      }
      set({ currentUser: null, authChecked: true });
      return false;
    } catch {
      set({ currentUser: null, authChecked: true });
      return false;
    }
  },

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ isLoading: false });
        return { success: false, error: data.error || 'Login failed' };
      }
      set({ currentUser: data.user, isLoading: false, authChecked: true });
      // Fetch initial data
      get().fetchDashboardData();
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err?.message || 'Network error' };
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      set({ currentUser: null, authChecked: true });
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  },

  updateMyPassword: async (newPassword: string) => {
    const { currentUser } = get();
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/staff/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  updateProfile: async (data) => {
    const { currentUser } = get();
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/staff/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        set({ currentUser: json.staff });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  fetchDashboardData: async () => {
    const { fetchCustomers, fetchProducts, fetchInvoices, fetchSettings } = get();
    await Promise.allSettled([
      fetchCustomers(),
      fetchProducts(),
      fetchInvoices(),
      fetchSettings(),
    ]);
  },

  fetchStaff: async () => {
    try {
      const res = await fetch('/api/staff');
      if (res.ok) {
        const data = await res.json();
        set({ staffList: data.staff || [] });
      }
    } catch (e) {
      console.error('Failed to fetch staff', e);
    }
  },

  fetchCustomers: async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        set({ customers: data.customers || [] });
      }
    } catch (e) {
      console.error('Failed to fetch customers', e);
    }
  },

  fetchProducts: async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        set({ products: data.products || [] });
      }
    } catch (e) {
      console.error('Failed to fetch products', e);
    }
  },

  fetchInvoices: async () => {
    try {
      const res = await fetch('/api/invoices');
      if (res.ok) {
        const data = await res.json();
        set({ invoices: data.invoices || [] });
      }
    } catch (e) {
      console.error('Failed to fetch invoices', e);
    }
  },

  fetchSettings: async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          set({ companySettings: data.settings });
        }
      }
    } catch (e) {
      console.error('Failed to fetch settings', e);
    }
  },

  fetchCostTax: async () => {
    try {
      const res = await fetch('/api/cost-tax');
      if (res.ok) {
        const data = await res.json();
        set({ costTaxData: data });
      }
    } catch (e) {
      console.error('Failed to fetch cost & tax data', e);
    }
  },

  fetchAuditLogs: async () => {
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        set({ auditLogs: data.auditLogs || [] });
      }
    } catch (e) {
      console.error('Failed to fetch audit logs', e);
    }
  },

  createStaff: async (staffData) => {
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData),
      });
      const data = await res.json();
      if (res.ok) {
        get().fetchStaff();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to create staff' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  },

  updateStaff: async (id, staffData) => {
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData),
      });
      const data = await res.json();
      if (res.ok) {
        get().fetchStaff();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to update staff' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  },

  deleteStaff: async (id) => {
    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        get().fetchStaff();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to delete staff' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  },

  toggleStaffStatus: async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    const res = await get().updateStaff(id, { status: nextStatus });
    return res.success;
  },

  addCustomer: async (customerData) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      const data = await res.json();
      if (res.ok) {
        get().fetchCustomers();
        return { success: true, customer: data.customer };
      }
      return { success: false, error: data.error || 'Failed to add customer' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  },

  updateCustomer: async (id, customerData) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      const data = await res.json();
      if (res.ok) {
        get().fetchCustomers();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to update customer' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  },

  deleteCustomer: async (id) => {
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        get().fetchCustomers();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to delete customer' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  },

  addProduct: async (productData) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      if (res.ok) {
        get().fetchProducts();
        return { success: true, product: data.product };
      }
      return { success: false, error: data.error || 'Failed to add product' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  },

  updateProduct: async (id, productData) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      if (res.ok) {
        get().fetchProducts();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to update product' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  },

  deleteProduct: async (id) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        get().fetchProducts();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to delete product' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  },

  adjustStock: async (productId, actionType, quantity) => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, actionType, quantity }),
      });
      const data = await res.json();
      if (res.ok) {
        get().fetchProducts();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to adjust stock' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  },

  addInvoice: async (invoiceData) => {
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });
      const data = await res.json();
      if (res.ok) {
        get().fetchInvoices();
        get().fetchProducts();
        return { success: true, invoice: data.invoice };
      }
      return { success: false, error: data.error || 'Failed to create invoice' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  },

  updateInvoiceStatus: async (id, status) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        get().fetchInvoices();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  deleteInvoice: async (id) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        get().fetchInvoices();
        get().fetchProducts();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  updateCompanySettings: async (settingsData) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData),
      });
      if (res.ok) {
        get().fetchSettings();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  addExpense: async (expenseData) => {
    try {
      const res = await fetch('/api/cost-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: 'ADD_EXPENSE', ...expenseData }),
      });
      if (res.ok) {
        get().fetchCostTax();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  deleteExpense: async (expenseId) => {
    try {
      const res = await fetch('/api/cost-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: 'DELETE_EXPENSE', expenseId }),
      });
      if (res.ok) {
        get().fetchCostTax();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  updateCostTaxSettings: async (settingsData) => {
    try {
      const res = await fetch('/api/cost-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: 'UPDATE_SETTINGS', ...settingsData }),
      });
      if (res.ok) {
        get().fetchCostTax();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
}));
