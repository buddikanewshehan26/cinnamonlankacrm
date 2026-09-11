export type StaffPosition = 'Director' | 'Employer' | 'Admin' | 'Manager' | 'Supervisor';
export type AccountStatus = 'active' | 'disabled';
export type UserRole = 'SUPER_ADMIN' | 'STAFF';

export interface PermissionDefinition {
  key: string;
  label: string;
  category: string;
  description: string;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // Dashboard
  { key: 'dashboard.view', label: 'Dashboard', category: 'Dashboard', description: 'Access main executive dashboard' },
  
  // Inventory
  { key: 'inventory.view', label: 'Inventory - View', category: 'Inventory', description: 'View warehouse stock and levels' },
  { key: 'inventory.create', label: 'Inventory - Add', category: 'Inventory', description: 'Add and restock inventory' },
  { key: 'inventory.edit', label: 'Inventory - Edit', category: 'Inventory', description: 'Perform stock reconciliation and edits' },
  { key: 'inventory.delete', label: 'Inventory - Delete', category: 'Inventory', description: 'Remove inventory entries' },

  // Products
  { key: 'products.view', label: 'Products - View', category: 'Products', description: 'View product catalog' },
  { key: 'products.create', label: 'Products - Add', category: 'Products', description: 'Create new product listings' },
  { key: 'products.edit', label: 'Products - Edit', category: 'Products', description: 'Update product prices, info, and categories' },
  { key: 'products.delete', label: 'Products - Delete', category: 'Products', description: 'Delete products from catalog' },

  // Customers
  { key: 'customers.view', label: 'Customers - View', category: 'Customers', description: 'View customer directory' },
  { key: 'customers.create', label: 'Customers - Add', category: 'Customers', description: 'Add new customers and leads' },
  { key: 'customers.edit', label: 'Customers - Edit', category: 'Customers', description: 'Edit customer profile information' },
  { key: 'customers.delete', label: 'Customers - Delete', category: 'Customers', description: 'Delete customer profiles' },
  { key: 'customers.lifetime_history', label: 'Customer Lifetime Purchase History', category: 'Customers', description: 'Access lifetime spend, orders, and purchase breakdown' },

  // Invoices
  { key: 'invoices.view', label: 'Invoice - View', category: 'Invoices', description: 'View invoices and transactions' },
  { key: 'invoices.create', label: 'Invoice - Create', category: 'Invoices', description: 'Generate new invoices' },
  { key: 'invoices.edit', label: 'Invoice - Edit', category: 'Invoices', description: 'Edit invoice status and billing details' },
  { key: 'invoices.delete', label: 'Invoice - Delete', category: 'Invoices', description: 'Delete invoices' },

  // Reports
  { key: 'reports.view', label: 'Reports - View', category: 'Reports', description: 'View analytics and performance reports' },
  { key: 'reports.export', label: 'Reports - Export', category: 'Reports', description: 'Export report data to Excel/PDF' },

  // Business Profile
  { key: 'business_profile.view', label: 'Business Profile - View', category: 'Business Profile', description: 'View company info and branding' },
  { key: 'business_profile.edit', label: 'Business Profile - Edit', category: 'Business Profile', description: 'Modify company logo, name, address, email' },

  // Internal Cost & Tax
  { key: 'internal_cost.view', label: 'Internal Cost & Tax - View', category: 'Internal Cost & Tax', description: 'View COGS, tax liabilities, and profit calculations' },
  { key: 'internal_cost.edit', label: 'Internal Cost & Tax - Edit', category: 'Internal Cost & Tax', description: 'Configure product costs, packaging, shipping, expenses, and tax rates' },

  // System Settings
  { key: 'system_settings.view', label: 'System Settings - View', category: 'System Settings', description: 'View system configuration' },
  { key: 'system_settings.edit', label: 'System Settings - Edit', category: 'System Settings', description: 'Modify global system settings' },

  // Staff Management
  { key: 'staff.view', label: 'Staff - View', category: 'Staff Management', description: 'View staff members list' },
  { key: 'staff.create', label: 'Staff - Add', category: 'Staff Management', description: 'Create staff accounts' },
  { key: 'staff.edit', label: 'Staff - Edit', category: 'Staff Management', description: 'Edit staff account details' },
  { key: 'staff.disable', label: 'Staff - Enable/Disable', category: 'Staff Management', description: 'Toggle staff account status' },
  { key: 'staff.delete', label: 'Staff - Delete', category: 'Staff Management', description: 'Permanently remove staff accounts' },
  { key: 'staff.permissions', label: 'Staff - Manage Permissions', category: 'Staff Management', description: 'Assign or revoke staff permissions' },
];

export const PERMISSION_CATEGORIES = Array.from(new Set(ALL_PERMISSIONS.map(p => p.category)));

export function hasPermission(
  user: { role?: string; isSuperAdmin?: boolean; permissions?: string[] } | null | undefined,
  permissionKey: string
): boolean {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN' || user.isSuperAdmin === true) return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permissionKey);
}
