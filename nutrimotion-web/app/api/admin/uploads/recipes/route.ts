/**
 * Admin Recipes API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { Recipe } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_RECIPES]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const recipes = await Recipe.find({}).sort({ createdAt: -1 });
    return NextResponse.json(recipes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_RECIPES]);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    await connectDB();
    const body = await request.json();
    
    const { title, description, imageUrl, ingredients, instructions, prepTime, cookTime, servings, difficulty, tags, isFree } = body;
    
    if (!title || !description || !imageUrl || prepTime === undefined || cookTime === undefined || servings === undefined || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const recipe = await Recipe.create({
      title,
      description,
      imageUrl,
      ingredients: ingredients || [],
      instructions: instructions || [],
      prepTime,
      cookTime,
      servings,
      difficulty,
      tags: tags || [],
      isFree: isFree === true,
    });
    
    return NextResponse.json({
      id: recipe._id.toString(),
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
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create recipe' },
      { status: 500 }
    );
  }
}
