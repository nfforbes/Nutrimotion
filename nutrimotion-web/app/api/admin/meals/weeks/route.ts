/**
 * GET ?from=YYYY-MM-DD&to=YYYY-MM-DD (Mondays) — the meals placed in each Monday–Sunday week.
 * Without `from`, returns the current week (Jamaica time).
 */

import { NextRequest } from 'next/server';
import { getWeekPlans } from '@/lib/meals/weekPlan';
import { mealPlanAction } from '@/lib/meals/mealPlanRoute';
import { jamaicaTodayKey, weekStartOf } from '@/lib/orders/orderWeek';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') || weekStartOf(jamaicaTodayKey());
  return mealPlanAction(request, 'Load weeks', () => getWeekPlans(from, searchParams.get('to') || from));
}
