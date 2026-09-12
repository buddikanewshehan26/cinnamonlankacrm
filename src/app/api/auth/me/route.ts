import { NextResponse } from 'next/server';
import { getSession } from '@/server/auth';

export async function GET() {
  const session = await getSession();

  if (!session || !session.userId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Keep the session check fast and independent from large CRM records.
  // Detailed permission/account checks still happen in protected API routes.
  const safeUser = {
    id: session.userId,
    name: session.username,
    username: session.username,
    email: '',
    phone: '',
    position: session.role === 'SUPER_ADMIN' ? 'Director' : 'Staff',
    role: session.role,
    isSuperAdmin: Boolean(session.isSuperAdmin),
    status: 'active' as const,
    permissions: session.role === 'SUPER_ADMIN' || session.isSuperAdmin ? ['*'] : [],
    lastLogin: null,
  };

  return NextResponse.json({
    user: safeUser,
  });
}
