/**
 * Videos API — returns only videos this user may open, plus how many full videos are locked.
 * A free short exposes `shortUrl` without the full `videoUrl`.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/lib/db/connection';
import { VideoAsset } from '@/lib/db/models';
import { getAccessSetting, getSpotlightIds, hasActiveSubscription } from '@/lib/content/access';
import { Permission } from '@/types/auth';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { session } = authResult;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');

    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (tag) query.tags = tag;

    const videos = await VideoAsset.find(query).sort({ createdAt: -1 });
    const allIds = videos.map((v) => v._id.toString());

    const isAdmin = session.permissions.includes(Permission.MANAGE_VIDEOS);
    const subscribed = isAdmin || (await hasActiveSubscription(session.user.sub, 'videos'));
    const setting = await getAccessSetting('videos');
    const spotlight = new Set(await getSpotlightIds('videos', allIds, setting));

    let fullCount = 0;
    const items = videos.flatMap((video) => {
      const id = video._id.toString();
      const full = subscribed || video.isFree === true || spotlight.has(id);
      const shortUrl = video.freeShortUrl?.trim() || '';
      if (!full && !shortUrl) return [];
      if (full) fullCount += 1;
      return [
        {
          id,
          title: video.title,
          description: video.description,
          thumbnailUrl: video.thumbnailUrl,
          videoUrl: full ? video.videoUrl : null,
          shortUrl: full ? null : shortUrl,
          access: full ? 'full' : 'short',
          duration: video.duration,
          category: video.category,
          tags: video.tags,
          isFree: video.isFree === true,
          thisWeek: spotlight.has(id),
          createdAt: video.createdAt,
          updatedAt: video.updatedAt,
        },
      ];
    });

    return NextResponse.json({
      subscribed,
      total: videos.length,
      lockedCount: videos.length - fullCount,
      monthlyPrice: setting.monthlyPrice ?? 0,
      items,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}
