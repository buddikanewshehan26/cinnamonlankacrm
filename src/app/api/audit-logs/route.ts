import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/guards';
import { getDB, saveDB } from '@/server/db';

export async function GET(req: Request) {
  // Audit logs are accessible to Super Admin or users with staff.view/system_settings.view
  const auth = await authenticateRequest(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (auth.user.role !== 'SUPER_ADMIN' && !auth.user.permissions?.includes('system_settings.view')) {
    return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 });
  }

  const db = await getDB();
  return NextResponse.json({ auditLogs: db.auditLogs });
}

export async function DELETE(req: Request) {
  const auth = await authenticateRequest(req);
  if ('errorResponse' in auth) return auth.errorResponse;
  if (auth.user.role !== 'SUPER_ADMIN' && !auth.user.isSuperAdmin) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 });
  const { ids } = await req.json();
  if (!Array.isArray(ids) || !ids.length) return NextResponse.json({ error: 'Select at least one audit log.' }, { status: 400 });
  const db = await getDB();
  const selected = new Set(ids);
  db.auditLogs = db.auditLogs.filter(log => !selected.has(log.id));
  await saveDB(db);
  return NextResponse.json({ success: true });
}
