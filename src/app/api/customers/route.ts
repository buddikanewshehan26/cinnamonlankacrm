import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/guards';
import { getDB, saveDB, logAudit, CustomerRecord } from '@/server/db';
import { hasPermission } from '@/lib/permissions';

export async function GET(req: Request) {
  const auth = await authenticateRequest(req, 'customers.view');
  if ('errorResponse' in auth) return auth.errorResponse;

  const db = await getDB();
  const canViewLifetime = auth.user.role === 'SUPER_ADMIN' || hasPermission(auth.user, 'customers.lifetime_history');

  const customersWithStats = db.customers.map(c => {
    if (!canViewLifetime) {
      return { ...c, lifetimeStats: null };
    }

    const customerInvoices = db.invoices.filter(inv => inv.customerId === c.id);
    const totalOrders = customerInvoices.length;
    const totalPurchaseValue = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = customerInvoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.total, 0);
    const outstandingAmount = customerInvoices.filter(inv => inv.status === 'Pending').reduce((sum, inv) => sum + inv.total, 0);

    const sortedDates = customerInvoices.map(inv => inv.date).filter(Boolean).sort();
    const firstPurchaseDate = sortedDates[0] || null;
    const lastPurchaseDate = sortedDates[sortedDates.length - 1] || null;

    return {
      ...c,
      lifetimeStats: {
        totalOrders,
        totalPurchaseValue,
        totalPaid,
        outstandingAmount,
        firstPurchaseDate,
        lastPurchaseDate,
        invoiceCount: totalOrders,
      }
    };
  });

  return NextResponse.json({ customers: customersWithStats });
}

export async function POST(req: Request) {
  const auth = await authenticateRequest(req, 'customers.create');
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const {
      name,
      companyName = '',
      country,
      email,
      phone,
      address = '',
      birthday = '',
      notes = '',
      ranking = 'Normal',
      avatar = '',
      customerId,
    } = body;

    if (!name || !country || !email || !phone) {
      return NextResponse.json(
        { error: 'Customer Name, Country, Email, and Phone are required.' },
        { status: 400 }
      );
    }

    const db = await getDB();
    const nextCodeNum = db.customers.length + 1001;
    const generatedCustomerId = customerId || `CUST-${nextCodeNum}`;

    const newCustomer: CustomerRecord = {
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      customerId: generatedCustomerId,
      name: String(name).trim(),
      companyName: String(companyName).trim(),
      country: String(country).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      address: String(address).trim(),
      birthday: String(birthday).trim(),
      notes: String(notes).trim(),
      ranking: ranking || 'Normal',
      avatar: avatar || `https://picsum.photos/seed/${encodeURIComponent(name)}/200/200`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.customers.push(newCustomer);
    await saveDB(db);

    await logAudit({
      userId: auth.user.id,
      userName: auth.user.name,
      userRole: auth.user.role,
      action: 'CUSTOMER_CREATED',
      target: newCustomer.name,
      details: `Registered new customer ${newCustomer.name} (${newCustomer.customerId}) from ${newCustomer.country}`,
    });

    return NextResponse.json({ success: true, customer: newCustomer }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to add customer' }, { status: 500 });
  }
}
