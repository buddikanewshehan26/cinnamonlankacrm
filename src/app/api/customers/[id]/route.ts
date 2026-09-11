import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/guards';
import { getDB, saveDB, logAudit } from '@/server/db';
import { hasPermission } from '@/lib/permissions';

// GET: Fetch customer profile with lifetime purchase history & products purchased
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = await authenticateRequest(req, 'customers.view');
  if ('errorResponse' in auth) return auth.errorResponse;

  const db = await getDB();
  const customer = db.customers.find(c => c.id === id);

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
  }

  const canViewLifetime = auth.user.role === 'SUPER_ADMIN' || hasPermission(auth.user, 'customers.lifetime_history');

  let lifetimeDetails = null;

  if (canViewLifetime) {
    const customerInvoices = db.invoices.filter(inv => inv.customerId === customer.id);
    const totalOrders = customerInvoices.length;
    const totalPurchaseValue = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = customerInvoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.total, 0);
    const outstandingAmount = customerInvoices.filter(inv => inv.status === 'Pending').reduce((sum, inv) => sum + inv.total, 0);

    const sortedDates = customerInvoices.map(inv => inv.date).filter(Boolean).sort();
    const firstPurchaseDate = sortedDates[0] || null;
    const lastPurchaseDate = sortedDates[sortedDates.length - 1] || null;

    // Detailed item breakdown
    const productPurchasesMap: { [productId: string]: { productName: string; sku: string; totalQty: number; totalSpent: number; lastOrderDate: string } } = {};

    customerInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const prod = db.products.find(p => p.id === item.productId);
        const pName = prod?.name || 'Product item';
        const pSku = prod?.sku || 'N/A';
        
        if (!productPurchasesMap[item.productId]) {
          productPurchasesMap[item.productId] = {
            productName: pName,
            sku: pSku,
            totalQty: 0,
            totalSpent: 0,
            lastOrderDate: inv.date,
          };
        }

        productPurchasesMap[item.productId].totalQty += item.quantity;
        productPurchasesMap[item.productId].totalSpent += item.quantity * item.price;
        if (inv.date > productPurchasesMap[item.productId].lastOrderDate) {
          productPurchasesMap[item.productId].lastOrderDate = inv.date;
        }
      });
    });

    lifetimeDetails = {
      totalOrders,
      totalPurchaseValue,
      totalPaid,
      outstandingAmount,
      firstPurchaseDate,
      lastPurchaseDate,
      invoices: customerInvoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.date,
        total: inv.total,
        status: inv.status,
        currency: inv.currency,
        itemsCount: inv.items.reduce((s, i) => s + i.quantity, 0),
        items: inv.items.map(item => {
          const prod = db.products.find(p => p.id === item.productId);
          return {
            productId: item.productId,
            name: prod?.name || 'Product',
            sku: prod?.sku || '',
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price,
          };
        }),
      })),
      productsPurchased: Object.values(productPurchasesMap),
    };
  }

  return NextResponse.json({
    customer,
    lifetime: lifetimeDetails,
  });
}

// PUT: Update customer details
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = await authenticateRequest(req, 'customers.edit');
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const db = await getDB();
    const customerIndex = db.customers.findIndex(c => c.id === id);

    if (customerIndex === -1) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    const currentCustomer = db.customers[customerIndex];
    const prev = { ...currentCustomer };

    if (body.name !== undefined) currentCustomer.name = String(body.name).trim();
    if (body.companyName !== undefined) currentCustomer.companyName = String(body.companyName).trim();
    if (body.country !== undefined) currentCustomer.country = String(body.country).trim();
    if (body.email !== undefined) currentCustomer.email = String(body.email).trim();
    if (body.phone !== undefined) currentCustomer.phone = String(body.phone).trim();
    if (body.address !== undefined) currentCustomer.address = String(body.address).trim();
    if (body.birthday !== undefined) currentCustomer.birthday = String(body.birthday).trim();
    if (body.notes !== undefined) currentCustomer.notes = String(body.notes).trim();
    if (body.ranking !== undefined) currentCustomer.ranking = body.ranking;
    if (body.avatar !== undefined) currentCustomer.avatar = body.avatar;
    if (body.customerId !== undefined) currentCustomer.customerId = String(body.customerId).trim();
    currentCustomer.updatedAt = new Date().toISOString();

    db.customers[customerIndex] = currentCustomer;
    await saveDB(db);

    await logAudit({
      userId: auth.user.id,
      userName: auth.user.name,
      userRole: auth.user.role,
      action: 'CUSTOMER_UPDATED',
      target: currentCustomer.name,
      details: `Updated customer profile for ${currentCustomer.name}`,
      prevValue: prev,
      newValue: currentCustomer,
    });

    return NextResponse.json({ success: true, customer: currentCustomer });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update customer' }, { status: 500 });
  }
}

// DELETE: Delete a customer
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = await authenticateRequest(req, 'customers.delete');
  if ('errorResponse' in auth) return auth.errorResponse;

  const db = await getDB();
  const customer = db.customers.find(c => c.id === id);

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
  }

  db.customers = db.customers.filter(c => c.id !== id);
  await saveDB(db);

  await logAudit({
    userId: auth.user.id,
    userName: auth.user.name,
    userRole: auth.user.role,
    action: 'CUSTOMER_DELETED',
    target: customer.name,
    details: `Deleted customer ${customer.name} (${customer.customerId})`,
  });

  return NextResponse.json({ success: true, message: 'Customer deleted successfully.' });
}
