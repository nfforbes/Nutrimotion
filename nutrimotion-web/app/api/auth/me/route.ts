/**
 * Get Current User API
 */

import { NextResponse } from 'next/server';
import { getSessionWithPermissions } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await getSessionWithPermissions();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      user: {
        id: session.dbUserId,
        email: session.user.email,
        name: session.user.name,
        picture: (session.user as { picture?: string }).picture,
      },
      roles: session.roles,
      permissions: session.permissions,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
