import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/guards';
import { getDB, saveDB, logAudit } from '@/server/db';
import { hasPermission } from '@/lib/permissions';

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = await authenticateRequest(req, 'products.edit');
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const db = await getDB();
    const productIndex = db.products.findIndex(p => p.id === id);

    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const currentProduct = db.products[productIndex];
    const prev = { ...currentProduct };
    const canEditCost = auth.user.role === 'SUPER_ADMIN' || hasPermission(auth.user, 'internal_cost.edit');

    if (body.name !== undefined) currentProduct.name = String(body.name).trim();
    if (body.category !== undefined) currentProduct.category = String(body.category).trim();
    if (body.sku !== undefined) currentProduct.sku = String(body.sku).trim().toUpperCase();
    if (body.priceUSD !== undefined) currentProduct.priceUSD = Number(body.priceUSD);
    if (body.priceLKR !== undefined) currentProduct.priceLKR = Number(body.priceLKR);
    if (body.image !== undefined) currentProduct.image = body.image;
    if (body.stock !== undefined) currentProduct.stock = Math.max(0, Number(body.stock));
    if (body.maxStockCapacity !== undefined) currentProduct.maxStockCapacity = Number(body.maxStockCapacity);
    if (body.lowStockThreshold !== undefined) currentProduct.lowStockThreshold = Number(body.lowStockThreshold);

    // Only update internal costs if user is authorized
    if (canEditCost) {
      if (body.costUSD !== undefined) currentProduct.costUSD = Number(body.costUSD);
      if (body.costLKR !== undefined) currentProduct.costLKR = Number(body.costLKR);
      if (body.packagingCostUSD !== undefined) currentProduct.packagingCostUSD = Number(body.packagingCostUSD);
      if (body.shippingCostUSD !== undefined) currentProduct.shippingCostUSD = Number(body.shippingCostUSD);
      if (body.taxRatePercent !== undefined) currentProduct.taxRatePercent = Number(body.taxRatePercent);
    }

    db.products[productIndex] = currentProduct;
    await saveDB(db);

    await logAudit({
      userId: auth.user.id,
      userName: auth.user.name,
      userRole: auth.user.role,
      action: 'PRODUCT_UPDATED',
      target: currentProduct.name,
      details: `Updated product details for ${currentProduct.name} (${currentProduct.sku})`,
      prevValue: prev,
      newValue: currentProduct,
    });

    return NextResponse.json({ success: true, product: currentProduct });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = await authenticateRequest(req, 'products.delete');
  if ('errorResponse' in auth) return auth.errorResponse;

  const db = await getDB();
  const product = db.products.find(p => p.id === id);

  if (!product) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  db.products = db.products.filter(p => p.id !== id);
  await saveDB(db);

  await logAudit({
    userId: auth.user.id,
    userName: auth.user.name,
    userRole: auth.user.role,
    action: 'PRODUCT_DELETED',
    target: product.name,
    details: `Deleted product ${product.name} (${product.sku})`,
  });

  return NextResponse.json({ success: true, message: 'Product deleted successfully.' });
}
