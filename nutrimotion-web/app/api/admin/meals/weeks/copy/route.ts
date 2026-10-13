/**
 * POST { from, to } (Mondays) — copies every meal of one week into another.
 */

import { NextRequest } from 'next/server';
import { copyWeek } from '@/lib/meals/weekPlan';
import { mealPlanAction, readJson } from '@/lib/meals/mealPlanRoute';

export async function POST(request: NextRequest) {
  return mealPlanAction(request, 'Copy week', async () => {
    const body = await readJson(request);
    return copyWeek(body.from, body.to);
  });
}
