/**
 * POST { name, contentType } — returns { uploadUrl } for the mobile app to PUT a meal photo (max 5 MB).
 * The PUT responds with JSON containing the public `url`; save it with PUT /api/admin/meals/photo.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import { MEAL_PHOTO_MAX_BYTES, MEAL_PHOTO_TYPES, createMealPhotoUploadUrl } from '@/lib/meals/mealPhoto';

export async function POST(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_MEALS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const contentType = typeof body.contentType === 'string' ? body.contentType.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'Meal name is required' }, { status: 400 });
    }
    if (!MEAL_PHOTO_TYPES[contentType]) {
      return NextResponse.json({ error: 'Photos must be JPG, PNG or WebP' }, { status: 400 });
    }

    const uploadUrl = await createMealPhotoUploadUrl(name, contentType);
    return NextResponse.json({ uploadUrl, maxBytes: MEAL_PHOTO_MAX_BYTES });
  } catch (error) {
    console.error('Meal photo upload URL error:', error);
    return NextResponse.json({ error: 'Could not prepare the upload' }, { status: 500 });
  }
}
