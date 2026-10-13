/**
 * PATCH edits a saved meal (and its days from today onwards); DELETE removes it from the meal list.
 */

import { NextRequest } from 'next/server';
import { deleteCatalogMeal, updateCatalogMeal } from '@/lib/meals/weekPlan';
import { mealPlanAction, readJson } from '@/lib/meals/mealPlanRoute';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return mealPlanAction(request, 'Save meal', async () => updateCatalogMeal(id, await readJson(request)));
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return mealPlanAction(request, 'Delete meal', async () => {
    await deleteCatalogMeal(id);
    return { ok: true };
  });
}
