/**
 * Admin Meal by ID — update (PATCH) or delete (DELETE)
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { MealPackage } from '@/lib/db/models';
import { MealSlot } from '@/types/catalog';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_MEALS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid meal id' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, imageUrl, price, instagramLink, slot, scheduledDate, ingredients, nutritionInfo, available } = body;

    const missing: string[] = [];
    if (!name || typeof name !== 'string' || !name.trim()) missing.push('name');
    if (!description || typeof description !== 'string' || !description.trim()) missing.push('description');
    if (price === undefined || price === null || Number.isNaN(Number(price)) || Number(price) < 0) missing.push('price');
    if (!slot || typeof slot !== 'string' || !slot.trim()) missing.push('slot');
    if (!scheduledDate || typeof scheduledDate !== 'string' || !scheduledDate.trim()) missing.push('scheduledDate');

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing or invalid required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    if (!Object.values(MealSlot).includes(slot as MealSlot)) {
      return NextResponse.json({ error: 'Invalid meal slot' }, { status: 400 });
    }

    const priceNum = Number(price);
    const update: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim(),
      price: priceNum,
      slot: slot.trim(),
      scheduledDate: new Date(scheduledDate),
      imageUrl: imageUrl && typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : undefined,
      instagramLink: instagramLink && typeof instagramLink === 'string' && instagramLink.trim() ? instagramLink.trim() : undefined,
    };

    if (typeof available === 'boolean') {
      update.available = available;
    }
    if (ingredients !== undefined) {
      update.ingredients = ingredients;
    }
    if (nutritionInfo !== undefined) {
      update.nutritionInfo = nutritionInfo;
    }

    const meal = await MealPackage.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });

    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    return NextResponse.json(meal);
  } catch (error) {
    console.error('Update meal error:', error);
    return NextResponse.json({ error: 'Failed to update meal' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_MEALS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid meal id' }, { status: 400 });
    }

    const deleted = await MealPackage.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete meal error:', error);
    return NextResponse.json({ error: 'Failed to delete meal' }, { status: 500 });
  }
}
