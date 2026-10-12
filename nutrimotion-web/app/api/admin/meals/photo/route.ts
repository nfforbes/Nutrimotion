/**
 * PUT { name, imageUrl } — sets (or clears, when imageUrl is empty) the photo on every day of a meal.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import { setMealPhoto } from '@/lib/meals/mealPhoto';

export async function PUT(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_MEALS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'Meal name is required' }, { status: 400 });
    }

    const updated = await setMealPhoto(name, imageUrl);
    return NextResponse.json({ ok: true, updated });
  } catch (error) {
    console.error('Meal photo update error:', error);
    return NextResponse.json({ error: 'Failed to save the photo' }, { status: 500 });
  }
}
