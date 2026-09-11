import { NextResponse } from 'next/server';
import { getSession, clearSessionCookie } from '@/server/auth';
import { getDB } from '@/server/db';

export async function GET() {
  const session = await getSession();

  if (!session || !session.userId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const db = await getDB();
  const user = db.users.find(u => u.id === session.userId);

  if (!user) {
    await clearSessionCookie();
    return NextResponse.json({ user: null, error: 'User not found' }, { status: 401 });
  }

  if (user.status === 'disabled') {
    await clearSessionCookie();
    return NextResponse.json(
      { user: null, error: 'Account has been deactivated.' },
      { status: 403 }
    );
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    position: user.position,
    role: user.role,
    isSuperAdmin: user.isSuperAdmin,
    status: user.status,
    permissions: user.permissions,
    avatar: user.avatar,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };

  return NextResponse.json({
    user: safeUser,
  });
}
