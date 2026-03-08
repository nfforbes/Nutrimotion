/**
 * Admin Upload Training Packages API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import mongoose from 'mongoose';

const TrainingPackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  duration: { type: String, required: true },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  includes: [String],
}, { timestamps: true });

const TrainingPackage = mongoose.models.TrainingPackage || mongoose.model('TrainingPackage', TrainingPackageSchema);

export async function GET(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_TRAINING]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const packages = await TrainingPackage.find({}).sort({ createdAt: -1 });
    return NextResponse.json(packages);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch training packages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_TRAINING]);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    await connectDB();
    const body = await request.json();
    
    const { name, description, imageUrl, price, duration, level, includes } = body;
    
    if (!name || !description || !imageUrl || price === undefined || !duration || !level) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const trainingPackage = await TrainingPackage.create({
      name,
      description,
      imageUrl,
      price,
      duration,
      level,
      includes: includes || [],
    });
    
    return NextResponse.json({
      id: trainingPackage._id.toString(),
      name: trainingPackage.name,
      description: trainingPackage.description,
      imageUrl: trainingPackage.imageUrl,
      price: trainingPackage.price,
      duration: trainingPackage.duration,
      level: trainingPackage.level,
      includes: trainingPackage.includes,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create training package' },
      { status: 500 }
    );
  }
}
