import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/guards';
import { getDB, saveDB, logAudit, ExpenseRecord } from '@/server/db';

// GET: Retrieve Internal Cost, Tax configurations, and Profit Calculation in LKR Currency
export async function GET(req: Request) {
  const auth = await authenticateRequest(req, 'internal_cost.view');
  if ('errorResponse' in auth) return auth.errorResponse;

  const db = await getDB();

  // Exchange multiplier if invoice/price was historically recorded in USD
  const exchangeRate = db.costTaxSettings.exchangeRateUSDToLKR || 300;
  const toLKR = (val: number, curr?: string) => {
    if (curr === 'USD') return val * exchangeRate;
    return val;
  };

  let totalRevenueLKR = 0;
  let totalCOGSLKR = 0;
  let totalPackagingCostLKR = 0;
  let totalShippingCostLKR = 0;
  let totalTaxCollectedLKR = 0;

  const defaultPkgLKR = db.costTaxSettings.defaultPackagingCostLKR || (db.costTaxSettings.defaultPackagingCostUSD || 1.5) * 300;
  const defaultShipLKR = db.costTaxSettings.defaultShippingCostLKR || (db.costTaxSettings.defaultShippingCostUSD || 5.0) * 300;

  db.invoices.forEach(inv => {
    const invTotalLKR = toLKR(inv.total, inv.currency);
    const invTaxLKR = toLKR(inv.tax || 0, inv.currency);
    totalRevenueLKR += invTotalLKR;
    totalTaxCollectedLKR += invTaxLKR;

    inv.items.forEach(item => {
      const product = db.products.find(p => p.id === item.productId);
      const unitCostLKR = product?.costLKR || (product?.costUSD ? product.costUSD * 300 : 0) || (item.costLKR || 0);
      const unitPkgLKR = product?.packagingCostLKR || (product?.packagingCostUSD ? product.packagingCostUSD * 300 : defaultPkgLKR);
      const unitShipLKR = product?.shippingCostLKR || (product?.shippingCostUSD ? product.shippingCostUSD * 300 : 0);

      totalCOGSLKR += unitCostLKR * item.quantity;
      totalPackagingCostLKR += unitPkgLKR * item.quantity;
      totalShippingCostLKR += unitShipLKR * item.quantity;
    });
  });

  const totalOverheadExpensesLKR = db.costTaxSettings.expenses.reduce(
    (sum, exp) => sum + (exp.amountLKR || (exp.amountUSD ? exp.amountUSD * 300 : 0)), 
    0
  );

  const grossProfitLKR = totalRevenueLKR - totalCOGSLKR;
  const netProfitLKR = totalRevenueLKR - totalCOGSLKR - totalPackagingCostLKR - totalShippingCostLKR - totalOverheadExpensesLKR;
  const netProfitMarginPercent = totalRevenueLKR > 0 ? (netProfitLKR / totalRevenueLKR) * 100 : 0;
  const grossMarginPercent = totalRevenueLKR > 0 ? (grossProfitLKR / totalRevenueLKR) * 100 : 0;

  // Product level profitability in LKR
  const productProfitability = db.products.map(p => {
    const priceLKR = p.priceLKR || (p.priceUSD ? p.priceUSD * 300 : 0);
    const costLKR = p.costLKR || (p.costUSD ? p.costUSD * 300 : 0);
    const pkgLKR = p.packagingCostLKR || (p.packagingCostUSD ? p.packagingCostUSD * 300 : defaultPkgLKR);
    const shipLKR = p.shippingCostLKR || (p.shippingCostUSD ? p.shippingCostUSD * 300 : 0);

    const marginLKR = priceLKR - costLKR - pkgLKR;
    const marginPercent = priceLKR > 0 ? (marginLKR / priceLKR) * 100 : 0;

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      priceLKR,
      costLKR,
      packagingCostLKR: pkgLKR,
      shippingCostLKR: shipLKR,
      taxRatePercent: p.taxRatePercent || 0,
      unitProfitLKR: marginLKR,
      marginPercent: Math.round(marginPercent * 10) / 10,
    };
  });

  const formattedExpenses = db.costTaxSettings.expenses.map(e => ({
    id: e.id,
    title: e.title,
    category: e.category,
    amountLKR: e.amountLKR || (e.amountUSD ? e.amountUSD * 300 : 0),
    date: e.date,
    notes: e.notes || '',
  }));

  return NextResponse.json({
    settings: {
      defaultTaxRatePercent: db.costTaxSettings.defaultTaxRatePercent || 5,
      exchangeRateUSDToLKR: exchangeRate,
      exchangeRateUpdatedAt: db.costTaxSettings.exchangeRateUpdatedAt || null,
      defaultPackagingCostLKR: defaultPkgLKR,
      defaultShippingCostLKR: defaultShipLKR,
      expenses: formattedExpenses,
    },
    productsCostData: productProfitability,
    profitMetrics: {
      totalRevenueLKR,
      totalCOGSLKR,
      totalPackagingCostLKR,
      totalShippingCostLKR,
      totalOverheadExpensesLKR,
      totalTaxCollectedLKR,
      grossProfitLKR,
      netProfitLKR,
      grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
      netProfitMarginPercent: Math.round(netProfitMarginPercent * 10) / 10,
    },
  });
}

// POST: Add overhead expense in LKR or update global cost parameters
export async function POST(req: Request) {
  const auth = await authenticateRequest(req, 'internal_cost.edit');
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { actionType } = body;
    const db = await getDB();

    if (actionType === 'ADD_EXPENSE') {
      const { title, category = 'Other', amountLKR, amountUSD, date = new Date().toISOString().split('T')[0], notes = '' } = body;
      const numAmountLKR = Number(amountLKR !== undefined ? amountLKR : (amountUSD ? Number(amountUSD) * 300 : 0));

      if (!title || numAmountLKR <= 0) {
        return NextResponse.json({ error: 'Title and a valid positive amount are required.' }, { status: 400 });
      }

      const newExpense: ExpenseRecord = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: String(title).trim(),
        category,
        amountUSD: Math.round(numAmountLKR / 300),
        amountLKR: numAmountLKR,
        date: String(date),
        notes: String(notes).trim(),
      };

      db.costTaxSettings.expenses.unshift(newExpense);
      await saveDB(db);

      await logAudit({
        userId: auth.user.id,
        userName: auth.user.name,
        userRole: auth.user.role,
        action: 'INTERNAL_EXPENSE_ADDED',
        target: newExpense.title,
        details: `Added operating expense "${newExpense.title}" of Rs. ${newExpense.amountLKR.toLocaleString()} in ${newExpense.category}`,
        newValue: newExpense,
      });

      return NextResponse.json({ success: true, expense: newExpense }, { status: 201 });
    }

    if (actionType === 'DELETE_EXPENSE') {
      if (auth.user.role !== 'SUPER_ADMIN' && !auth.user.isSuperAdmin) {
        return NextResponse.json({ error: 'Only Super Admin can delete expense records.' }, { status: 403 });
      }
      const { expenseId } = body;
      const exp = db.costTaxSettings.expenses.find(e => e.id === expenseId);
      db.costTaxSettings.expenses = db.costTaxSettings.expenses.filter(e => e.id !== expenseId);
      await saveDB(db);

      await logAudit({
        userId: auth.user.id,
        userName: auth.user.name,
        userRole: auth.user.role,
        action: 'INTERNAL_EXPENSE_DELETED',
        target: exp?.title || expenseId,
        details: `Deleted internal expense record ${exp?.title || expenseId}`,
      });

      return NextResponse.json({ success: true, message: 'Expense deleted.' });
    }

    if (actionType === 'UPDATE_SETTINGS') {
      if (auth.user.role !== 'SUPER_ADMIN' && !auth.user.isSuperAdmin) {
        return NextResponse.json({ error: 'Only Super Admin can update exchange-rate settings.' }, { status: 403 });
      }
      const { defaultTaxRatePercent, defaultPackagingCostLKR, defaultShippingCostLKR, exchangeRateUSDToLKR } = body;
      if (exchangeRateUSDToLKR !== undefined && Number(exchangeRateUSDToLKR) > 0) {
        db.costTaxSettings.exchangeRateUSDToLKR = Number(exchangeRateUSDToLKR);
        db.costTaxSettings.exchangeRateUpdatedAt = new Date().toISOString();
      }
      if (defaultTaxRatePercent !== undefined) db.costTaxSettings.defaultTaxRatePercent = Number(defaultTaxRatePercent);
      if (defaultPackagingCostLKR !== undefined) {
        db.costTaxSettings.defaultPackagingCostLKR = Number(defaultPackagingCostLKR);
        db.costTaxSettings.defaultPackagingCostUSD = Number(defaultPackagingCostLKR) / 300;
      }
      if (defaultShippingCostLKR !== undefined) {
        db.costTaxSettings.defaultShippingCostLKR = Number(defaultShippingCostLKR);
        db.costTaxSettings.defaultShippingCostUSD = Number(defaultShippingCostLKR) / 300;
      }

      await saveDB(db);

      await logAudit({
        userId: auth.user.id,
        userName: auth.user.name,
        userRole: auth.user.role,
        action: 'INTERNAL_COST_SETTINGS_UPDATED',
        target: 'Cost & Tax Settings',
        details: 'Updated global internal tax and default packaging/shipping parameters in LKR',
        newValue: db.costTaxSettings,
      });

      return NextResponse.json({ success: true, settings: db.costTaxSettings });
    }

    return NextResponse.json({ error: 'Invalid action type.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Cost & Tax operation failed' }, { status: 500 });
  }
}
