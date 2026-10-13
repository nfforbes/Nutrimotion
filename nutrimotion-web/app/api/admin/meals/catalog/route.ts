/**
 * Saved meals the admin places into weeks.
 * GET lists them; POST { name, description, price, slot, soldIndividually, instagramLink } creates one.
 */

import { NextRequest } from 'next/server';
import { createCatalogMeal, listCatalog } from '@/lib/meals/weekPlan';
import { mealPlanAction, readJson } from '@/lib/meals/mealPlanRoute';

export async function GET(request: NextRequest) {
  return mealPlanAction(request, 'Load meals', () => listCatalog());
}

export async function POST(request: NextRequest) {
  return mealPlanAction(request, 'Add meal', async () => createCatalogMeal(await readJson(request)), 201);
}
