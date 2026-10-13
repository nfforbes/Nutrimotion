import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import { MealPlanError } from '@/lib/meals/weekPlan';

/** Runs a meal-planning action for an admin, turning MealPlanError into a 400 with its message. */
export async function mealPlanAction<T>(
  request: NextRequest,
  label: string,
  action: () => Promise<T>,
  status = 200
): Promise<NextResponse> {
  const authResult = await requirePermissions(request, [Permission.MANAGE_MEALS]);
  if (authResult instanceof NextResponse) return authResult;
  try {
    return NextResponse.json(await action(), { status });
  } catch (error) {
    if (error instanceof MealPlanError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(`${label} error:`, error);
    return NextResponse.json({ error: `Failed to ${label.toLowerCase()}` }, { status: 500 });
  }
}

export async function readJson(request: NextRequest): Promise<Record<string, unknown>> {
  return request.json().catch(() => ({}));
}
