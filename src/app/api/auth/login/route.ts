import { NextResponse } from 'next/server';
import { getDB, saveDB, logAudit } from '@/server/db';
import { verifyPassword, createSessionToken, setSessionCookie } from '@/server/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const db = await getDB();
    const cleanIdentifier = String(username).trim().toLowerCase();

    // Match by username or email (case-insensitive)
    const user = db.users.find(
      u => u.username.toLowerCase() === cleanIdentifier || u.email.toLowerCase() === cleanIdentifier
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    if (user.status === 'disabled') {
      return NextResponse.json(
        { error: 'This account has been disabled by the Super Admin. Please contact management.' },
        { status: 403 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    await saveDB(db);

    await logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      target: user.username,
      details: `User logged in successfully from ${user.position}`,
    });

    const token = createSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
    });

    await setSessionCookie(token);

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
      success: true,
      user: safeUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error during login' },
      { status: 500 }
    );
  }
}
