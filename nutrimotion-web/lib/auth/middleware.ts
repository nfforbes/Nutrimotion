/**
 * Auth Middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { Permission } from '@/types/auth';
import { getSessionWithPermissions, hasAllPermissions } from './session';

export async function requireAuth(request: NextRequest) {
  const session = await getSessionWithPermissions();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'You must be logged in' },
      { status: 401 }
    );
  }
  
  return { session };
}

export async function requirePermissions(
  request: NextRequest,
  requiredPermissions: Permission[]
) {
  const session = await getSessionWithPermissions();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'You must be logged in' },
      { status: 401 }
    );
  }
  
  if (!hasAllPermissions(session.permissions, requiredPermissions)) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
      },
      { status: 403 }
    );
  }
  
  return { session };
}

export function createAuthMiddleware(requiredPermissions?: Permission[]) {
  return async (request: NextRequest) => {
    if (requiredPermissions && requiredPermissions.length > 0) {
      return requirePermissions(request, requiredPermissions);
    }
    return requireAuth(request);
  };
}
