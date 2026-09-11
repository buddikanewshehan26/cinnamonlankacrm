import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/guards';
import { getDB } from '@/server/db';

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
