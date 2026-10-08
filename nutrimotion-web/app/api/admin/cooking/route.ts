/**
 * Kitchen cooking list.
 * GET ?count=2 → { today, cookDays, plans }   PUT { cookDays: number[] } → same
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import { getCookingPlans, normalizeCookDays, setCookDays } from '@/lib/kitchen/cookPlan';

function planCount(request: NextRequest): number {
  const n = Number(new URL(request.url).searchParams.get('count'));
  return Number.isInteger(n) && n >= 1 && n <= 6 ? n : 2;
}

export async function GET(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.ADMIN_DASHBOARD]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    return NextResponse.json(await getCookingPlans(planCount(request)));
  } catch (error) {
    console.error('Cooking list error:', error);
    return NextResponse.json({ error: 'Failed to load the cooking list' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_MEALS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json().catch(() => ({}));
    const days = normalizeCookDays(body?.cookDays);
    if (!days) {
      return NextResponse.json({ error: 'Cook days must be weekdays 0 (Sunday) to 6 (Saturday).' }, { status: 400 });
    }
    await setCookDays(days);
    return NextResponse.json(await getCookingPlans(planCount(request)));
  } catch (error) {
    console.error('Save cook days error:', error);
    return NextResponse.json({ error: 'Failed to save cook days' }, { status: 500 });
  }
}
