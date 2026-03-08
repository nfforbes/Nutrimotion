/**
 * Videos API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/lib/db/connection';
import mongoose from 'mongoose';

const VideoAssetSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  videoUrl: { type: String, required: true },
  duration: { type: Number, required: true },
  category: { type: String, enum: ['cooking', 'training'], required: true },
  tags: [String],
}, { timestamps: true });

const VideoAsset = mongoose.models.VideoAsset || mongoose.model('VideoAsset', VideoAssetSchema);

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    
    let query: any = {};
    if (category) query.category = category;
    if (tag) query.tags = tag;
    
    const videos = await VideoAsset.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json(videos.map((video) => ({
      id: video._id.toString(),
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      videoUrl: video.videoUrl,
      duration: video.duration,
      category: video.category,
      tags: video.tags,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    })));
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
