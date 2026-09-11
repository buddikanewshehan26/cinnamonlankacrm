import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/guards';
import { getDB, saveDB, logAudit, UserRecord } from '@/server/db';
import { hashPassword } from '@/server/auth';
import { StaffPosition } from '@/lib/permissions';

// GET all staff members
// STRICT PRIVACY: Super Admin account is visible ONLY to Super Admin themselves.
// Directors, Admins, and other staff can ONLY see staff accounts.
export async function GET(req: Request) {
  const auth = await authenticateRequest(req, 'staff.view');
  if ('errorResponse' in auth) return auth.errorResponse;

  const db = await getDB();
  const isRequesterSuperAdmin = auth.user.role === 'SUPER_ADMIN' || auth.user.isSuperAdmin;

  const visibleUsers = db.users.filter(u => {
    if (isRequesterSuperAdmin) return true;
    // Hide Super Admin from all other staff (Directors, Admins, etc.)
    return !u.isSuperAdmin && u.role !== 'SUPER_ADMIN' && u.username !== 'supadmin26';
  });

  const staffList = visibleUsers.map(u => ({
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    phone: u.phone,
    position: u.position,
    role: u.role,
    isSuperAdmin: u.isSuperAdmin,
    status: u.status,
    permissions: u.permissions,
    avatar: u.avatar,
    createdAt: u.createdAt,
    lastLogin: u.lastLogin,
  }));

  return NextResponse.json({ staff: staffList });
}

// POST: Create a new staff account
export async function POST(req: Request) {
  const auth = await authenticateRequest(req, 'staff.create');
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const {
      name,
      username,
      password,
      email,
      phone,
      position,
      status = 'active',
      permissions = [],
      avatar = '',
    } = body;

    if (!name || !username || !password || !email) {
      return NextResponse.json(
        { error: 'Name, username, password, and email are required fields.' },
        { status: 400 }
      );
    }

    const db = await getDB();
    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    // Check if username or email already exists
    const existing = db.users.find(
      u => u.username.toLowerCase() === cleanUsername.toLowerCase() || u.email.toLowerCase() === cleanEmail
    );

    if (existing) {
      return NextResponse.json(
        { error: 'A user with this username or email already exists.' },
        { status: 400 }
      );
    }

    const validPositions: StaffPosition[] = ['Director', 'Employer', 'Admin', 'Manager', 'Supervisor'];
    const assignedPosition: StaffPosition = validPositions.includes(position) ? position : 'Supervisor';

    const newUser: UserRecord = {
      id: `staff_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: String(name).trim(),
      username: cleanUsername,
      passwordHash: hashPassword(String(password)),
      email: cleanEmail,
      phone: String(phone || '').trim(),
      position: assignedPosition,
      role: 'STAFF',
      isSuperAdmin: false,
      status: status === 'disabled' ? 'disabled' : 'active',
      permissions: Array.isArray(permissions) ? permissions : [],
      avatar: avatar || `https://picsum.photos/seed/${cleanUsername}/200/200`,
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };

    db.users.push(newUser);
    await saveDB(db);

    await logAudit({
      userId: auth.user.id,
      userName: auth.user.name,
      userRole: auth.user.role,
      action: 'STAFF_CREATED',
      target: newUser.username,
      details: `Created staff account for ${newUser.name} with position ${newUser.position} and ${newUser.permissions.length} permissions.`,
      newValue: {
        id: newUser.id,
        username: newUser.username,
        position: newUser.position,
        permissions: newUser.permissions,
      },
    });

    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      phone: newUser.phone,
      position: newUser.position,
      role: newUser.role,
      isSuperAdmin: newUser.isSuperAdmin,
      status: newUser.status,
      permissions: newUser.permissions,
      avatar: newUser.avatar,
      createdAt: newUser.createdAt,
      lastLogin: newUser.lastLogin,
    };

    return NextResponse.json({ success: true, staff: safeUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create staff account' }, { status: 500 });
  }
}
