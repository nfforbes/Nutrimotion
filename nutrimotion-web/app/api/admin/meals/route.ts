/**
 * Admin Meals API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { MealPackage } from '@/lib/db/models';

export async function POST(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_MEALS]);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    await connectDB();
    const body = await request.json();

    const { name, description, imageUrl, price, instagramLink, slot, scheduledDate, ingredients, nutritionInfo } = body;

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
    
    const priceNum = Number(price);
    
    const meal = await MealPackage.create({
      name: name.trim(),
      description: description.trim(),
      imageUrl: (imageUrl && typeof imageUrl === 'string') ? imageUrl.trim() : undefined,
      price: priceNum,
      instagramLink: instagramLink?.trim() || undefined,
      slot: slot.trim(),
      scheduledDate: new Date(scheduledDate),
      available: true,
      ingredients,
      nutritionInfo,
    });
    
    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    console.error('Create meal error:', error);
    return NextResponse.json(
      { error: 'Failed to create meal' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_MEALS]);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    let query: any = {};
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
    }
    
    const meals = await MealPackage.find(query).sort({ scheduledDate: 1, slot: 1 });
    
    return NextResponse.json(meals);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch meals' },
      { status: 500 }
    );
  }
}
