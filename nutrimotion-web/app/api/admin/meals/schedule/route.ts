/**
 * Admin Meal Scheduling API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { MealPackage } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_MEALS]);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let query: any = {};
    
    if (startDate && endDate) {
      query.scheduledDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    const meals = await MealPackage.find(query).sort({ scheduledDate: 1, slot: 1 });
    
    return NextResponse.json(meals);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch meal schedule' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_MEALS]);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    await connectDB();
    const body = await request.json();
    
    const { meals } = body; // Array of meals to create
    
    if (!Array.isArray(meals) || meals.length === 0) {
      return NextResponse.json(
        { error: 'Meals array is required' },
        { status: 400 }
      );
    }
    
    const createdMeals = await MealPackage.insertMany(
      meals.map((meal: any) => ({
        ...meal,
        scheduledDate: new Date(meal.scheduledDate),
        available: true,
      }))
    );
    
    return NextResponse.json(createdMeals, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create meals' },
      { status: 500 }
    );
  }
}
