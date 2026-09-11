import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/guards';
import { getDB, saveDB, logAudit } from '@/server/db';
import { CurrencyType } from '@/lib/store';

export async function GET(req: Request) {
  const auth = await authenticateRequest(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  const db = await getDB();
  return NextResponse.json({
    settings: db.companySettings,
    canEdit: auth.user.role === 'SUPER_ADMIN' || auth.user.permissions?.includes('business_profile.edit'),
  });
}

export async function PUT(req: Request) {
  const auth = await authenticateRequest(req, 'business_profile.edit');
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const db = await getDB();
    const prev = { ...db.companySettings };

    if (body.name !== undefined) db.companySettings.name = String(body.name).trim();
    if (body.address !== undefined) db.companySettings.address = String(body.address).trim();
    if (body.hotline !== undefined) db.companySettings.hotline = String(body.hotline).trim();
    if (body.email !== undefined) db.companySettings.email = String(body.email).trim().toLowerCase();
    if (body.website !== undefined) db.companySettings.website = String(body.website).trim();
    if (body.logo !== undefined) db.companySettings.logo = body.logo;
    if (body.primaryColor !== undefined) db.companySettings.primaryColor = body.primaryColor;
    if (body.currency !== undefined) db.companySettings.currency = body.currency as 'USD' | 'LKR';

    await saveDB(db);

    await logAudit({
      userId: auth.user.id,
      userName: auth.user.name,
      userRole: auth.user.role,
      action: 'BUSINESS_PROFILE_UPDATED',
      target: 'Company Settings',
      details: `Updated company branding and contact information (${db.companySettings.name})`,
      prevValue: prev,
      newValue: db.companySettings,
    });

    return NextResponse.json({ success: true, settings: db.companySettings });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update settings' }, { status: 500 });
  }
}
