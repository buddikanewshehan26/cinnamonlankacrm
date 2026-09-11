import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/guards';
import { getDB, saveDB, logAudit } from '@/server/db';

// PUT: Update invoice status or details
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = await authenticateRequest(req, 'invoices.edit');
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const db = await getDB();
    const invoiceIndex = db.invoices.findIndex(i => i.id === id);

    if (invoiceIndex === -1) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    const currentInvoice = db.invoices[invoiceIndex];
    const prev = { ...currentInvoice };

    if (body.status !== undefined) {
      currentInvoice.status = body.status === 'Paid' ? 'Paid' : 'Pending';
    }
    if (body.tax !== undefined) currentInvoice.tax = Number(body.tax);
    if (body.shipping !== undefined) currentInvoice.shipping = Number(body.shipping);
    if (body.discount !== undefined) currentInvoice.discount = Number(body.discount);
    if (body.total !== undefined) currentInvoice.total = Number(body.total);
    if (body.date !== undefined) currentInvoice.date = String(body.date);

    db.invoices[invoiceIndex] = currentInvoice;
    await saveDB(db);

    await logAudit({
      userId: auth.user.id,
      userName: auth.user.name,
      userRole: auth.user.role,
      action: 'INVOICE_UPDATED',
      target: currentInvoice.invoiceNumber,
      details: `Updated invoice ${currentInvoice.invoiceNumber} status to ${currentInvoice.status}`,
      prevValue: prev,
      newValue: currentInvoice,
    });

    return NextResponse.json({ success: true, invoice: currentInvoice });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update invoice' }, { status: 500 });
  }
}

// DELETE: Delete an invoice
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = await authenticateRequest(req, 'invoices.delete');
  if ('errorResponse' in auth) return auth.errorResponse;

  const db = await getDB();
  const invoice = db.invoices.find(i => i.id === id);

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
  }

  // Restore inventory stock for deleted invoice items
  invoice.items.forEach(item => {
    const product = db.products.find(p => p.id === item.productId);
    if (product) {
      product.stock += item.quantity;
    }
  });

  db.invoices = db.invoices.filter(i => i.id !== id);
  await saveDB(db);

  await logAudit({
    userId: auth.user.id,
    userName: auth.user.name,
    userRole: auth.user.role,
    action: 'INVOICE_DELETED',
    target: invoice.invoiceNumber,
    details: `Deleted invoice ${invoice.invoiceNumber} totaling ${invoice.currency} ${invoice.total} and restored item stock.`,
  });

  return NextResponse.json({ success: true, message: 'Invoice deleted successfully and stock restored.' });
}
