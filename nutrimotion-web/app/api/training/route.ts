/**
 * Training Packages API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
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
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    await connectDB();
    
    const packages = await TrainingPackage.find().sort({ createdAt: -1 });
    
    return NextResponse.json(packages.map((pkg) => ({
      id: pkg._id.toString(),
      name: pkg.name,
      description: pkg.description,
      imageUrl: pkg.imageUrl,
      price: pkg.price,
      duration: pkg.duration,
      level: pkg.level,
      includes: pkg.includes,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
    })));
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch training packages' },
      { status: 500 }
    );
  }
}
