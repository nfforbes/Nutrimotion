/**
 * A saved meal in a week's slot.
 * POST { weekStart, slot, name, from? } places it for all 7 days (or moves it when `from` is given).
 * DELETE { weekStart, slot, name } removes it from that week.
 * PATCH { weekStart, slot, name, available?, soldIndividually? } changes its flags for the week.
 */

import { NextRequest } from 'next/server';
import { placeMeal, removeMeal, setWeekMealFlags } from '@/lib/meals/weekPlan';
import { mealPlanAction, readJson } from '@/lib/meals/mealPlanRoute';

export async function POST(request: NextRequest) {
  return mealPlanAction(request, 'Place meal', async () => placeMeal(await readJson(request)));
}

export async function DELETE(request: NextRequest) {
  return mealPlanAction(request, 'Remove meal', async () => removeMeal(await readJson(request)));
}

export async function PATCH(request: NextRequest) {
  return mealPlanAction(request, 'Update meal', async () => setWeekMealFlags(await readJson(request)));
}
