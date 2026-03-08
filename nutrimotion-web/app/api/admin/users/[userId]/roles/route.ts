import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission, UserRole } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { User } from '@/lib/db/models';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_USERS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { userId } = await params;
    const body = await request.json();
    const { roles } = body;

    if (!Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json({ error: 'At least one role is required' }, { status: 400 });
    }

    const validRoles = Object.values(UserRole);
    const invalid = roles.filter((r: string) => !validRoles.includes(r as UserRole));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Invalid roles: ${invalid.join(', ')}` },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { roles },
      { new: true, runValidators: true }
    ).select('name email roles createdAt updatedAt');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Update roles error:', error);
    return NextResponse.json({ error: 'Failed to update roles' }, { status: 500 });
  }
}
