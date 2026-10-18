/**
 * Admin Training Package — PATCH fields / DELETE package.
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';

const TrainingPackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    duration: { type: String, required: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
    includes: [String],
  },
  { timestamps: true }
);

const TrainingPackage =
  mongoose.models.TrainingPackage || mongoose.model('TrainingPackage', TrainingPackageSchema);

const LEVELS = new Set(['beginner', 'intermediate', 'advanced']);

function serialize(pkg: {
  _id: { toString(): string };
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  duration: string;
  level: string;
  includes?: string[];
}) {
  return {
    _id: pkg._id.toString(),
    id: pkg._id.toString(),
    name: pkg.name,
    description: pkg.description,
    imageUrl: pkg.imageUrl,
    price: pkg.price,
    duration: pkg.duration,
    level: pkg.level,
    includes: pkg.includes || [],
  };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_TRAINING]);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid training package id' }, { status: 400 });
  }

  try {
    await connectDB();
    const body = await request.json();
    const update: Record<string, unknown> = {};

    if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim();
    if (typeof body.description === 'string' && body.description.trim()) {
      update.description = body.description.trim();
    }
    if (typeof body.imageUrl === 'string' && body.imageUrl.trim()) {
      update.imageUrl = body.imageUrl.trim();
    }
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (Number.isNaN(price) || price < 0) {
        return NextResponse.json({ error: 'Price must be a number 0 or greater.' }, { status: 400 });
      }
      update.price = price;
    }
    if (typeof body.duration === 'string' && body.duration.trim()) {
      update.duration = body.duration.trim();
    }
    if (typeof body.level === 'string') {
      if (!LEVELS.has(body.level)) {
        return NextResponse.json({ error: 'Level must be beginner, intermediate or advanced.' }, { status: 400 });
      }
      update.level = body.level;
    }
    if (Array.isArray(body.includes)) {
      update.includes = body.includes.map((s: unknown) => String(s).trim()).filter(Boolean);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
    }

    const pkg = await TrainingPackage.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!pkg) {
      return NextResponse.json({ error: 'Training package not found' }, { status: 404 });
    }
    return NextResponse.json(serialize(pkg));
  } catch {
    return NextResponse.json({ error: 'Failed to update training package' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_TRAINING]);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid training package id' }, { status: 400 });
  }

  try {
    await connectDB();
    const pkg = await TrainingPackage.findByIdAndDelete(id);
    if (!pkg) {
      return NextResponse.json({ error: 'Training package not found' }, { status: 404 });
    }
    return NextResponse.json({ deleted: true, id });
  } catch {
    return NextResponse.json({ error: 'Failed to delete training package' }, { status: 500 });
  }
}
