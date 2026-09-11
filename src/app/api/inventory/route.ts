import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/guards';
import { getDB, saveDB, logAudit } from '@/server/db';

export async function GET(req: Request) {
  const auth = await authenticateRequest(req, 'inventory.view');
  if ('errorResponse' in auth) return auth.errorResponse;

  const db = await getDB();
  const inventoryMatrix = db.products.map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    stock: p.stock,
    maxStockCapacity: p.maxStockCapacity,
    lowStockThreshold: p.lowStockThreshold,
    isLowStock: p.stock <= p.lowStockThreshold,
    usagePercentage: (p.stock / p.maxStockCapacity) * 100,
  }));

  return NextResponse.json({ inventory: inventoryMatrix });
}

// POST: Adjust or Reconcile stock
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, actionType, quantity } = body; // actionType: 'REFILL' | 'RECONCILE'

    const requiredPerm = actionType === 'REFILL' ? 'inventory.create' : 'inventory.edit';
    const auth = await authenticateRequest(req, requiredPerm);
    if ('errorResponse' in auth) return auth.errorResponse;

    const db = await getDB();
    const product = db.products.find(p => p.id === productId);

    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const previousStock = product.stock;
    let newStock = previousStock;

    if (actionType === 'REFILL') {
      const added = Number(quantity);
      if (isNaN(added) || added <= 0) {
        return NextResponse.json({ error: 'Refill quantity must be a positive number.' }, { status: 400 });
      }
      newStock = previousStock + added;
    } else if (actionType === 'RECONCILE') {
      const target = Number(quantity);
      if (isNaN(target) || target < 0) {
        return NextResponse.json({ error: 'Reconciled stock cannot be negative.' }, { status: 400 });
      }
      newStock = target;
    } else {
      return NextResponse.json({ error: 'Invalid inventory action type.' }, { status: 400 });
    }

    product.stock = newStock;
    await saveDB(db);

    await logAudit({
      userId: auth.user.id,
      userName: auth.user.name,
      userRole: auth.user.role,
      action: actionType === 'REFILL' ? 'STOCK_REFILL' : 'STOCK_RECONCILE',
      target: product.name,
      details: `${actionType === 'REFILL' ? 'Added' : 'Adjusted'} stock for ${product.name} from ${previousStock} to ${newStock} units.`,
      prevValue: { stock: previousStock },
      newValue: { stock: newStock },
    });

    return NextResponse.json({
      success: true,
      productId: product.id,
      previousStock,
      newStock,
      message: `Stock updated for ${product.name}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Inventory adjustment failed' }, { status: 500 });
  }
}
