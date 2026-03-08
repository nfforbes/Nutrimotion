/**
 * Admin Package by ID API (PATCH)
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { Package } from '@/lib/db/models';
import type { DaysOption } from '@/lib/db/models/Package';

function validateSpecificDays(arr: unknown): arr is number[] {
  if (!Array.isArray(arr)) return false;
  return arr.every((d) => typeof d === 'number' && Number.isInteger(d) && d >= 0 && d <= 6);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_PACKAGES]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      description,
      breakfastCount,
      lunchCount,
      dinnerCount,
      cost,
      daysOption,
      specificDays,
      active,
    } = body;

    const missing: string[] = [];
    if (!name || typeof name !== 'string' || !name.trim()) missing.push('name');
    if (breakfastCount === undefined || breakfastCount === null || Number.isNaN(Number(breakfastCount)) || Number(breakfastCount) < 0)
      missing.push('breakfastCount');
    if (lunchCount === undefined || lunchCount === null || Number.isNaN(Number(lunchCount)) || Number(lunchCount) < 0)
      missing.push('lunchCount');
    if (dinnerCount === undefined || dinnerCount === null || Number.isNaN(Number(dinnerCount)) || Number(dinnerCount) < 0)
      missing.push('dinnerCount');
    if (!daysOption || (daysOption !== 'any' && daysOption !== 'specific'))
      missing.push('daysOption');

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing or invalid required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const opt = daysOption as DaysOption;
    if (opt === 'specific' && (!specificDays || !validateSpecificDays(specificDays))) {
      return NextResponse.json(
        { error: 'When days are "specific", provide specificDays as an array of 0–6 (Sun–Sat)' },
        { status: 400 }
      );
    }

    const costNum = cost !== undefined && cost !== null ? Number(cost) : 0;
    const raw: Record<string, unknown> = {
      name: name.trim(),
      description: description && typeof description === 'string' ? description.trim() : undefined,
      breakfastCount: Number(breakfastCount),
      lunchCount: Number(lunchCount),
      dinnerCount: Number(dinnerCount),
      cost: costNum >= 0 ? costNum : 0,
      daysOption: opt,
      specificDays: opt === 'specific' ? specificDays : [],
      active: active !== false,
      updatedAt: new Date(),
    };
    const updateFields = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>;

    // Use native MongoDB update to ensure cost is persisted (bypasses Mongoose schema cache)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid package ID' }, { status: 400 });
    }
    const result = await Package.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const doc = await Package.findById(id);
    return NextResponse.json(doc);
  } catch (error) {
    console.error('Update package error:', error);
    return NextResponse.json({ error: 'Failed to update package' }, { status: 500 });
  }
}
