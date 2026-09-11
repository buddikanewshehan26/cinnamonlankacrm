import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/guards';
import { getDB, saveDB, logAudit, InvoiceRecord } from '@/server/db';

export async function GET(req: Request) {
  const auth = await authenticateRequest(req, 'invoices.view');
  if ('errorResponse' in auth) return auth.errorResponse;

  const db = await getDB();
  return NextResponse.json({ invoices: db.invoices });
}

export async function POST(req: Request) {
  const auth = await authenticateRequest(req, 'invoices.create');
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const {
      customerId,
      date = new Date().toISOString().split('T')[0],
      items = [],
      tax = 0,
      shipping = 0,
      discount = 0,
      status = 'Pending',
      currency = 'USD',
    } = body;

    if (!customerId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer and at least one line item are required.' },
        { status: 400 }
      );
    }

    const db = await getDB();
    const customer = db.customers.find(c => c.id === customerId);

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    // Process line items and compute pricing / costs
    let computedSubtotal = 0;
    const processedItems = items.map((item: any) => {
      const product = db.products.find(p => p.id === item.productId);
      const price = Number(item.price !== undefined ? item.price : (currency === 'LKR' ? product?.priceLKR : product?.priceUSD) || 0);
      const qty = Number(item.quantity) || 1;
      const costUSD = product?.costUSD || 0;

      computedSubtotal += price * qty;

      // Deduct stock
      if (product) {
        product.stock = Math.max(0, product.stock - qty);
      }

      return {
        productId: item.productId,
        quantity: qty,
        price,
        costUSD,
      };
    });

    const discountVal = (computedSubtotal * Number(discount || 0)) / 100;
    const computedTotal = computedSubtotal - discountVal + Number(tax || 0) + Number(shipping || 0);

    const nextInvoiceNum = `INV-${db.invoices.length + 1001}`;

    const newInvoice: InvoiceRecord = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      invoiceNumber: nextInvoiceNum,
      customerId,
      date: String(date),
      items: processedItems,
      tax: Number(tax || 0),
      shipping: Number(shipping || 0),
      discount: Number(discount || 0),
      total: computedTotal,
      currency: currency === 'LKR' ? 'LKR' : 'USD',
      status: status === 'Paid' ? 'Paid' : 'Pending',
      createdAt: new Date().toISOString(),
    };

    db.invoices.unshift(newInvoice);
    await saveDB(db);

    await logAudit({
      userId: auth.user.id,
      userName: auth.user.name,
      userRole: auth.user.role,
      action: 'INVOICE_CREATED',
      target: newInvoice.invoiceNumber,
      details: `Generated invoice ${newInvoice.invoiceNumber} for ${customer.name} totaling ${newInvoice.currency} ${newInvoice.total.toFixed(2)}`,
      newValue: newInvoice,
    });

    return NextResponse.json({ success: true, invoice: newInvoice }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create invoice' }, { status: 500 });
  }
}
