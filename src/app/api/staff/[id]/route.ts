import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/guards';
import { getDB, saveDB, logAudit } from '@/server/db';
import { hashPassword } from '@/server/auth';
import { StaffPosition } from '@/lib/permissions';

// PUT: Update staff info, status, or permissions
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = await authenticateRequest(req, 'staff.edit');
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const db = await getDB();
    const staffIndex = db.users.findIndex(u => u.id === id);

    if (staffIndex === -1) {
      return NextResponse.json({ error: 'Staff account not found.' }, { status: 404 });
    }

    const targetUser = db.users[staffIndex];

    // Protect Super Admin from being demoted or modified by non-super admin
    if (targetUser.isSuperAdmin && !auth.user.isSuperAdmin) {
      return NextResponse.json({ error: 'Cannot modify Super Admin account.' }, { status: 403 });
    }

    const prevValue = {
      name: targetUser.name,
      username: targetUser.username,
      position: targetUser.position,
      status: targetUser.status,
      permissions: [...targetUser.permissions],
    };

    if (body.name !== undefined) targetUser.name = String(body.name).trim();
    if (body.email !== undefined) targetUser.email = String(body.email).trim().toLowerCase();
    if (body.phone !== undefined) targetUser.phone = String(body.phone).trim();
    if (body.position !== undefined) {
      const validPositions: StaffPosition[] = ['Director', 'Employer', 'Admin', 'Manager', 'Supervisor'];
      if (validPositions.includes(body.position)) {
        targetUser.position = body.position;
      }
    }
    if (body.status !== undefined && !targetUser.isSuperAdmin) {
      targetUser.status = body.status === 'disabled' ? 'disabled' : 'active';
    }
    if (Array.isArray(body.permissions)) {
      targetUser.permissions = body.permissions;
    }
    if (body.password && String(body.password).trim().length > 0) {
      targetUser.passwordHash = hashPassword(String(body.password).trim());
    }
    if (body.avatar !== undefined) {
      targetUser.avatar = body.avatar;
    }

    db.users[staffIndex] = targetUser;
    await saveDB(db);

    await logAudit({
      userId: auth.user.id,
      userName: auth.user.name,
      userRole: auth.user.role,
      action: 'STAFF_UPDATED',
      target: targetUser.username,
      details: `Updated staff profile & permissions for ${targetUser.name}`,
      prevValue,
      newValue: {
        name: targetUser.name,
        username: targetUser.username,
        position: targetUser.position,
        status: targetUser.status,
        permissions: targetUser.permissions,
      },
    });

    const safeUser = {
      id: targetUser.id,
      name: targetUser.name,
      username: targetUser.username,
      email: targetUser.email,
      phone: targetUser.phone,
      position: targetUser.position,
      role: targetUser.role,
      isSuperAdmin: targetUser.isSuperAdmin,
      status: targetUser.status,
      permissions: targetUser.permissions,
      avatar: targetUser.avatar,
      createdAt: targetUser.createdAt,
      lastLogin: targetUser.lastLogin,
    };

    return NextResponse.json({ success: true, staff: safeUser });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update staff member' }, { status: 500 });
  }
}

// DELETE: Delete a staff member
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = await authenticateRequest(req, 'staff.delete');
  if ('errorResponse' in auth) return auth.errorResponse;

  const db = await getDB();
  const targetUser = db.users.find(u => u.id === id);

  if (!targetUser) {
    return NextResponse.json({ error: 'Staff account not found.' }, { status: 404 });
  }

  if (targetUser.isSuperAdmin || targetUser.username === 'supadmin26') {
    return NextResponse.json({ error: 'The Super Admin account cannot be deleted.' }, { status: 403 });
  }

  if (targetUser.id === auth.user.id) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 403 });
  }

  db.users = db.users.filter(u => u.id !== id);
  await saveDB(db);

  await logAudit({
    userId: auth.user.id,
    userName: auth.user.name,
    userRole: auth.user.role,
    action: 'STAFF_DELETED',
    target: targetUser.username,
    details: `Deleted staff account ${targetUser.name} (${targetUser.username})`,
  });

  return NextResponse.json({ success: true, message: 'Staff account deleted successfully.' });
}
