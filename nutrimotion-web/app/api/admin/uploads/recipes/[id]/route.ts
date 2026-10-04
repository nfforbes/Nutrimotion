/**
 * Admin Recipe — PATCH access flags.
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { Recipe } from '@/lib/db/models';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_RECIPES]);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid recipe id' }, { status: 400 });
  }

  try {
    await connectDB();
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (typeof body.isFree === 'boolean') update.isFree = body.isFree;

    const recipe = await Recipe.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }
    return NextResponse.json(recipe);
  } catch {
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 });
  }
}
