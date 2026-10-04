/**
 * Admin Video — PATCH access flags (free for everyone, free short clip).
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { VideoAsset } from '@/lib/db/models';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_VIDEOS]);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid video id' }, { status: 400 });
  }

  try {
    await connectDB();
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (typeof body.isFree === 'boolean') update.isFree = body.isFree;
    if (typeof body.freeShortUrl === 'string') update.freeShortUrl = body.freeShortUrl.trim();

    const video = await VideoAsset.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    return NextResponse.json(video);
  } catch {
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
  }
}
