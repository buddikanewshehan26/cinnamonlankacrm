import { hashPassword } from './auth';
import { ALL_PERMISSIONS, StaffPosition, AccountStatus, UserRole } from '@/lib/permissions';

export interface UserRecord {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  email: string;
  phone: string;
  position: StaffPosition;
  role: UserRole;
  isSuperAdmin: boolean;
  status: AccountStatus;
  permissions: string[];
  avatar?: string;
  createdAt: string;
  lastLogin: string | null;
}

export interface CustomerRecord {
  id: string;
  customerId: string;
  name: string;
  companyName: string;
  country: string;
  email: string;
  phone: string;
  address: string;
  birthday: string;
  notes: string;
  ranking: 'Normal' | 'Regular' | 'VIP' | 'VVIP';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRecord {
  id: string;
  name: string;
  category: string;
  sku: string;
  priceUSD: number;
  priceLKR: number;
  costUSD: number;
  costLKR: number;
  packagingCostUSD: number;
  packagingCostLKR?: number;
  shippingCostUSD: number;
  shippingCostLKR?: number;
  taxRatePercent: number;
  image: string;
  stock: number;
  maxStockCapacity: number;
  lowStockThreshold: number;
  createdAt: string;
}

export interface InvoiceItem {
  productId: string;
  quantity: number;
  price: number;
  costUSD?: number;
  costLKR?: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  customerId: string;
  date: string;
  items: InvoiceItem[];
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: 'USD' | 'LKR';
  status: 'Paid' | 'Pending';
  createdAt: string;
}

export interface CompanySettingsRecord {
  name: string;
  address: string;
  hotline: string;
  email: string;
  website: string;
  logo: string;
  primaryColor: string;
  currency: 'USD' | 'LKR';
}

export interface ExpenseRecord {
  id: string;
  title: string;
  category: 'Rent' | 'Utilities' | 'Labor' | 'Logistics' | 'Marketing' | 'Other';
  amountUSD: number;
  amountLKR: number;
  date: string;
  notes?: string;
}

export interface CostTaxSettingsRecord {
  exchangeRateUSDToLKR?: number;
  exchangeRateUpdatedAt?: string;
  defaultTaxRatePercent: number;
  defaultPackagingCostUSD: number;
  defaultPackagingCostLKR: number;
  defaultShippingCostUSD: number;
  defaultShippingCostLKR: number;
  expenses: ExpenseRecord[];
}

export interface AuditLogRecord {
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

export interface CRMDatabase {
  users: UserRecord[];
  customers: CustomerRecord[];
  products: ProductRecord[];
  invoices: InvoiceRecord[];
  companySettings: CompanySettingsRecord;
  costTaxSettings: CostTaxSettingsRecord;
  auditLogs: AuditLogRecord[];
}


function getInitialDatabase(): CRMDatabase {
  const allPermKeys = ALL_PERMISSIONS.map(p => p.key);
  
  // Super Admin Credentials:
  // Username: supadmin26
  // Password: adminsup27
  const superAdmin: UserRecord = {
    id: 'user_super_admin',
    name: 'Super Administrator',
    username: 'supadmin26',
    passwordHash: hashPassword('adminsup27'),
    email: 'supadmin26@cinnamonlanka.com',
    phone: '+94 11 234 5678',
    position: 'Director',
    role: 'SUPER_ADMIN',
    isSuperAdmin: true,
    status: 'active',
    permissions: allPermKeys,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    lastLogin: null,
  };

  const initialProducts: ProductRecord[] = [
    {
      id: 'prod_1',
      name: 'Alba Cinnamon Grade C5',
      category: 'Premium Sticks',
      sku: 'CIN-ALB-01',
      priceUSD: 25.50,
      priceLKR: 7650,
      costUSD: 14.00,
      costLKR: 4200,
      packagingCostUSD: 1.20,
      packagingCostLKR: 360,
      shippingCostUSD: 2.50,
      shippingCostLKR: 750,
      taxRatePercent: 5.0,
      image: 'https://picsum.photos/seed/p1/400/400',
      stock: 150,
      maxStockCapacity: 1000,
      lowStockThreshold: 20,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prod_2',
      name: 'Cinnamon Bark Oil 60%',
      category: 'Essential Oils',
      sku: 'OIL-BRK-01',
      priceUSD: 120.00,
      priceLKR: 36000,
      costUSD: 65.00,
      costLKR: 19500,
      packagingCostUSD: 3.50,
      packagingCostLKR: 1050,
      shippingCostUSD: 6.00,
      shippingCostLKR: 1800,
      taxRatePercent: 8.0,
      image: 'https://picsum.photos/seed/p2/400/400',
      stock: 15,
      maxStockCapacity: 200,
      lowStockThreshold: 5,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prod_3',
      name: 'Ground Cinnamon Powder',
      category: 'Powder',
      sku: 'POW-GRD-01',
      priceUSD: 12.00,
      priceLKR: 3600,
      costUSD: 6.50,
      costLKR: 1950,
      packagingCostUSD: 0.80,
      packagingCostLKR: 240,
      shippingCostUSD: 1.50,
      shippingCostLKR: 450,
      taxRatePercent: 4.0,
      image: 'https://picsum.photos/seed/p3/400/400',
      stock: 850,
      maxStockCapacity: 1000,
      lowStockThreshold: 100,
      createdAt: new Date().toISOString(),
    },
  ];

  const initialCustomers: CustomerRecord[] = [
    {
      id: 'cust_1',
      customerId: 'CUST-1001',
      name: 'Sienna Global Traders',
      companyName: 'Sienna International LLC',
      country: 'United States',
      email: 'contact@sienna.com',
      phone: '+1 234 567 890',
      address: '742 Evergreen Terrace, Suite 400, New York, NY 10001',
      birthday: '1985-06-15',
      notes: 'Prefers bulk shipping monthly with vacuum packaging.',
      ranking: 'VIP',
      avatar: 'https://picsum.photos/seed/customer1/200/200',
      createdAt: '2025-01-10T10:00:00.000Z',
      updatedAt: '2025-01-10T10:00:00.000Z',
    },
    {
      id: 'cust_2',
      customerId: 'CUST-1002',
      name: 'London Spice Co.',
      companyName: 'London Spice Imports Ltd',
      country: 'United Kingdom',
      email: 'orders@londonspice.co.uk',
      phone: '+44 20 7946 0958',
      address: '12 Baker Street, Westminster, London, UK',
      birthday: '1990-11-28',
      notes: 'Sensitive to moisture levels. Always provide Certificate of Analysis.',
      ranking: 'Regular',
      avatar: 'https://picsum.photos/seed/customer2/200/200',
      createdAt: '2025-02-14T09:30:00.000Z',
      updatedAt: '2025-02-14T09:30:00.000Z',
    },
    {
      id: 'cust_3',
      customerId: 'CUST-1003',
      name: 'Hanseatic Botanicals GmbH',
      companyName: 'Hanseatic Botanicals',
      country: 'Germany',
      email: 'procurement@hanseatic-botanicals.de',
      phone: '+49 40 1234 5678',
      address: 'Speicherstadt Block D, Hamburg, Germany',
      birthday: '1982-03-04',
      notes: 'Organic certification required for every consignment.',
      ranking: 'VVIP',
      avatar: 'https://picsum.photos/seed/customer3/200/200',
      createdAt: '2025-03-01T08:00:00.000Z',
      updatedAt: '2025-03-01T08:00:00.000Z',
    },
  ];

  const initialInvoices: InvoiceRecord[] = [
    {
      id: 'inv_1001',
      invoiceNumber: 'INV-1001',
      customerId: 'cust_1',
      date: '2025-02-20',
      items: [
        { productId: 'prod_1', quantity: 50, price: 7650, costLKR: 4200 },
        { productId: 'prod_2', quantity: 5, price: 36000, costLKR: 19500 }
      ],
      tax: 28125,
      shipping: 45000,
      discount: 5,
      total: 587250,
      currency: 'LKR',
      status: 'Paid',
      createdAt: '2025-02-20T14:30:00.000Z',
    },
    {
      id: 'inv_1002',
      invoiceNumber: 'INV-1002',
      customerId: 'cust_2',
      date: '2025-03-05',
      items: [
        { productId: 'prod_3', quantity: 200, price: 3600, costLKR: 1950 }
      ],
      tax: 28800,
      shipping: 24000,
      discount: 0,
      total: 772800,
      currency: 'LKR',
      status: 'Paid',
      createdAt: '2025-03-05T11:15:00.000Z',
    },
    {
      id: 'inv_1003',
      invoiceNumber: 'INV-1003',
      customerId: 'cust_1',
      date: '2025-03-12',
      items: [
        { productId: 'prod_1', quantity: 100, price: 7650, costLKR: 4200 }
      ],
      tax: 38250,
      shipping: 60000,
      discount: 10,
      total: 786750,
      currency: 'LKR',
      status: 'Pending',
      createdAt: '2025-03-12T16:45:00.000Z',
    }
  ];

  return {
    users: [superAdmin],
    customers: initialCustomers,
    products: initialProducts,
    invoices: initialInvoices,
    companySettings: {
      name: 'Cinnamon Lanka Exports',
      address: 'No. 123, Galle Road, Colombo 03, Sri Lanka',
      hotline: '+94 11 234 5678',
      email: 'info@cinnamonlanka.com',
      website: 'https://cinnamonlanka.com',
      logo: '',
      primaryColor: '20 50% 47%',
      currency: 'LKR',
    },
    costTaxSettings: {
      exchangeRateUSDToLKR: 300,
      exchangeRateUpdatedAt: new Date().toISOString(),
      defaultTaxRatePercent: 5.0,
      defaultPackagingCostUSD: 1.50,
      defaultPackagingCostLKR: 450,
      defaultShippingCostUSD: 5.00,
      defaultShippingCostLKR: 1500,
      expenses: [
        { id: 'exp_1', title: 'Export Warehouse Lease', category: 'Rent', amountUSD: 1800, amountLKR: 540000, date: '2025-03-01', notes: 'Monthly Colombo Port lease' },
        { id: 'exp_2', title: 'Cold Storage & Dehumidifier Power', category: 'Utilities', amountUSD: 450, amountLKR: 135000, date: '2025-03-01', notes: 'Electricity bill' },
        { id: 'exp_3', title: 'Quality Grading Specialists', category: 'Labor', amountUSD: 2200, amountLKR: 660000, date: '2025-03-01', notes: 'Grading team payroll' },
      ],
    },
    auditLogs: [
      {
        id: 'audit_init',
        userId: 'user_super_admin',
        userName: 'Super Administrator',
        userRole: 'SUPER_ADMIN',
        action: 'SYSTEM_INITIALIZED',
        target: 'System',
        details: 'Initial database created with secure Super Admin account.',
        timestamp: new Date().toISOString(),
      }
    ],
  };
}

const STATE_TABLE = 'crm_resources';
const RESOURCE_KEYS = ['users', 'customers', 'products', 'invoices', 'companySettings', 'costTaxSettings', 'auditLogs'] as const;

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase environment variables are not configured.');
  return { url, key };
}

async function request(path: string, init?: RequestInit) {
  const { url, key } = getConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Supabase database error: ${await response.text()}`);
  return response;
}

export async function getDB(): Promise<CRMDatabase> {
  const response = await request(`${STATE_TABLE}?select=resource_key,data`);
  const rows = await response.json() as Array<{ resource_key: keyof CRMDatabase; data: unknown }>;
  if (rows.length) {
    const initial = getInitialDatabase();
    return rows.reduce((db, row) => ({ ...db, [row.resource_key]: row.data }), initial) as CRMDatabase;
  }
  const initial = getInitialDatabase();
  await saveDB(initial);
  return initial;
}

export async function saveDB(data: CRMDatabase): Promise<void> {
  await request(`${STATE_TABLE}?on_conflict=resource_key`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(RESOURCE_KEYS.map(resource_key => ({ resource_key, data: data[resource_key], updated_at: new Date().toISOString() }))),
  });
}

export async function logAudit(entry: Omit<AuditLogRecord, 'id' | 'timestamp'>) {
  const db = await getDB();
  const newLog: AuditLogRecord = {
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(newLog);
  // Keep last 1000 logs
  if (db.auditLogs.length > 1000) {
    db.auditLogs = db.auditLogs.slice(0, 1000);
  }
  await saveDB(db);
}
