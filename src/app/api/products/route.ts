import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/guards';
import { getDB, saveDB, logAudit, ProductRecord } from '@/server/db';
import { hasPermission } from '@/lib/permissions';

export async function GET(req: Request) {
  const auth = await authenticateRequest(req, 'products.view');
  if ('errorResponse' in auth) return auth.errorResponse;

  const db = await getDB();
  const canViewCost = auth.user.role === 'SUPER_ADMIN' || hasPermission(auth.user, 'internal_cost.view');

  const safeProducts = db.products.map(p => {
    if (canViewCost) return p;
    // Strip sensitive internal costs for staff
    const { costUSD, costLKR, packagingCostUSD, shippingCostUSD, ...safeProduct } = p;
    return safeProduct;
  });

  return NextResponse.json({ products: safeProducts });
}

export async function POST(req: Request) {
  const auth = await authenticateRequest(req, 'products.create');
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const {
      name,
      category,
      sku,
      priceUSD,
      priceLKR,
      costUSD = 0,
      costLKR = 0,
      packagingCostUSD = 0,
      shippingCostUSD = 0,
      taxRatePercent = 0,
      image = '',
      stock = 0,
      maxStockCapacity = 1000,
      lowStockThreshold = 20,
    } = body;

    if (!name || !sku || (priceUSD === undefined && priceLKR === undefined)) {
      return NextResponse.json(
        { error: 'Product Name, SKU, and Price (USD or LKR) are required.' },
        { status: 400 }
      );
    }

    const db = await getDB();
    const cleanSku = String(sku).trim().toUpperCase();

    if (db.products.some(p => p.sku.toUpperCase() === cleanSku)) {
      return NextResponse.json(
        { error: `A product with SKU "${cleanSku}" already exists.` },
        { status: 400 }
      );
    }

    const calculatedPriceUSD = priceUSD !== undefined ? Number(priceUSD) : (Number(priceLKR) / 300);
    const calculatedPriceLKR = priceLKR !== undefined ? Number(priceLKR) : (Number(priceUSD) * 300);
    const calculatedCostUSD = costUSD !== undefined ? Number(costUSD) : (Number(costLKR || 0) / 300);
    const calculatedCostLKR = costLKR !== undefined ? Number(costLKR) : (Number(costUSD || 0) * 300);
    const calculatedPkgLKR = body.packagingCostLKR !== undefined ? Number(body.packagingCostLKR) : (Number(packagingCostUSD || 0) * 300);
    const calculatedShipLKR = body.shippingCostLKR !== undefined ? Number(body.shippingCostLKR) : (Number(shippingCostUSD || 0) * 300);

    const newProduct: ProductRecord = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: String(name).trim(),
      category: String(category || 'General').trim(),
      sku: cleanSku,
      priceUSD: Math.round(calculatedPriceUSD * 100) / 100,
      priceLKR: Math.round(calculatedPriceLKR),
      costUSD: Math.round(calculatedCostUSD * 100) / 100,
      costLKR: Math.round(calculatedCostLKR),
      packagingCostUSD: Number(packagingCostUSD || 0),
      packagingCostLKR: Math.round(calculatedPkgLKR),
      shippingCostUSD: Number(shippingCostUSD || 0),
      shippingCostLKR: Math.round(calculatedShipLKR),
      taxRatePercent: Number(taxRatePercent || 0),
      image: image || `https://picsum.photos/seed/${encodeURIComponent(cleanSku)}/400/400`,
      stock: Number(stock || 0),
      maxStockCapacity: Number(maxStockCapacity || 1000),
      lowStockThreshold: Number(lowStockThreshold || 20),
      createdAt: new Date().toISOString(),
    };

    db.products.push(newProduct);
    await saveDB(db);

    await logAudit({
      userId: auth.user.id,
      userName: auth.user.name,
      userRole: auth.user.role,
      action: 'PRODUCT_CREATED',
      target: newProduct.name,
      details: `Created product ${newProduct.name} (${newProduct.sku}) with price $${newProduct.priceUSD}`,
      newValue: newProduct,
    });

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create product' }, { status: 500 });
  }
}
