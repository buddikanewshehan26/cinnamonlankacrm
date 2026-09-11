import { NextResponse } from 'next/server';
import { getSession } from './auth';
import { getDB, UserRecord } from './db';
import { hasPermission } from '@/lib/permissions';

export interface AuthContext {
  user: UserRecord;
}

export type RouteHandler = (req: Request, ctx: { params?: any; auth: AuthContext }) => Promise<Response>;

export async function authenticateRequest(
  req: Request,
  requiredPermission?: string
): Promise<{ user: UserRecord } | { errorResponse: NextResponse }> {
  const session = await getSession();
  
  if (!session || !session.userId) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      ),
    };
  }

  const db = await getDB();
  const user = db.users.find(u => u.id === session.userId);

  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { error: 'User account not found or was removed.' },
        { status: 401 }
      ),
    };
  }

  // Critical check: if user is disabled, immediately block access
  if (user.status === 'disabled') {
    return {
      errorResponse: NextResponse.json(
        { error: 'This account has been deactivated. Access revoked immediately.' },
        { status: 403 }
      ),
    };
  }

  // Super Admin bypasses all permission checks
  if (user.role === 'SUPER_ADMIN' || user.isSuperAdmin) {
    return { user };
  }

  // Check required permission if specified
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return {
      errorResponse: NextResponse.json(
        { error: `Forbidden: Missing required permission [${requiredPermission}]` },
        { status: 403 }
      ),
    };
  }

  return { user };
}
