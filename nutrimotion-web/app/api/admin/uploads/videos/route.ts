/**
 * Admin Videos API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { VideoAsset } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_VIDEOS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const videos = await VideoAsset.find({}).sort({ createdAt: -1 });
    return NextResponse.json(videos);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_VIDEOS]);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    await connectDB();
    const body = await request.json();
    
    const { title, description, thumbnailUrl, videoUrl, duration, category, tags, isFree, freeShortUrl } = body;
    
    if (!title || !description || !thumbnailUrl || !videoUrl || duration === undefined || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const video = await VideoAsset.create({
      title,
      description,
      thumbnailUrl,
      videoUrl,
      duration,
      category,
      tags: tags || [],
      isFree: isFree === true,
      freeShortUrl: typeof freeShortUrl === 'string' ? freeShortUrl.trim() : '',
    });
    
    return NextResponse.json({
      id: video._id.toString(),
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      videoUrl: video.videoUrl,
      duration: video.duration,
      category: video.category,
      tags: video.tags,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    );
  }
}
