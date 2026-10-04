/**
 * Recipes API — returns only recipes this user may open, plus how many are locked.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/lib/db/connection';
import { Recipe } from '@/lib/db/models';
import { getAccessSetting, getSpotlightIds, hasActiveSubscription } from '@/lib/content/access';
import { Permission } from '@/types/auth';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { session } = authResult;

    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get('difficulty');
    const tag = searchParams.get('tag');

    const query: Record<string, unknown> = {};
    if (difficulty) query.difficulty = difficulty;
    if (tag) query.tags = tag;

    const recipes = await Recipe.find(query).sort({ createdAt: -1 });
    const allIds = recipes.map((r) => r._id.toString());

    const isAdmin = session.permissions.includes(Permission.MANAGE_RECIPES);
    const subscribed = isAdmin || (await hasActiveSubscription(session.user.sub, 'recipes'));
    const setting = await getAccessSetting('recipes');
    const spotlight = new Set(await getSpotlightIds('recipes', allIds, setting));

    const items = recipes
      .filter((r) => subscribed || r.isFree || spotlight.has(r._id.toString()))
      .map((recipe) => {
        const id = recipe._id.toString();
        return {
          id,
          title: recipe.title,
          description: recipe.description,
          imageUrl: recipe.imageUrl,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          tags: recipe.tags,
          isFree: recipe.isFree === true,
          thisWeek: spotlight.has(id),
          createdAt: recipe.createdAt,
          updatedAt: recipe.updatedAt,
        };
      });

    return NextResponse.json({
      subscribed,
      total: recipes.length,
      lockedCount: recipes.length - items.length,
      monthlyPrice: setting.monthlyPrice ?? 0,
      items,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}
