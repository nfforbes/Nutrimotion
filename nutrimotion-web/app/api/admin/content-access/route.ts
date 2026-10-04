/**
 * Admin content access — subscription price and this week's picks per library.
 * GET ?library=recipes|videos   PATCH { library, monthlyPrice?, spotlightMode?, preferredIds?, randomCount? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { ContentAccessSetting, Recipe, VideoAsset } from '@/lib/db/models';
import type { ContentLibrary } from '@/lib/db/models';
import { currentWeekKey, getAccessSetting, getSpotlightIds } from '@/lib/content/access';

const PERMISSION: Record<ContentLibrary, Permission> = {
  recipes: Permission.MANAGE_RECIPES,
  videos: Permission.MANAGE_VIDEOS,
};

function parseLibrary(value: unknown): ContentLibrary | null {
  return value === 'recipes' || value === 'videos' ? value : null;
}

async function allIdsFor(library: ContentLibrary): Promise<string[]> {
  const docs =
    library === 'recipes'
      ? await Recipe.find({}).select('_id').lean()
      : await VideoAsset.find({}).select('_id').lean();
  return docs.map((d) => String(d._id));
}

async function describe(library: ContentLibrary) {
  const setting = await getAccessSetting(library);
  const thisWeekIds = await getSpotlightIds(library, await allIdsFor(library), setting);
  return {
    library,
    monthlyPrice: setting.monthlyPrice ?? 0,
    spotlightMode: setting.spotlightMode ?? 'preferred',
    preferredIds: setting.preferredIds ?? [],
    randomCount: setting.randomCount ?? 3,
    weekStart: currentWeekKey(),
    thisWeekIds,
  };
}

export async function GET(request: NextRequest) {
  const library = parseLibrary(new URL(request.url).searchParams.get('library'));
  if (!library) {
    return NextResponse.json({ error: 'library must be recipes or videos' }, { status: 400 });
  }
  const authResult = await requirePermissions(request, [PERMISSION[library]]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    return NextResponse.json(await describe(library));
  } catch {
    return NextResponse.json({ error: 'Failed to load access settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const library = parseLibrary(body.library);
  if (!library) {
    return NextResponse.json({ error: 'library must be recipes or videos' }, { status: 400 });
  }
  const authResult = await requirePermissions(request, [PERMISSION[library]]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const update: Record<string, unknown> = {};
    if (body.monthlyPrice !== undefined) {
      const price = Number(body.monthlyPrice);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ error: 'Price must be 0 or more' }, { status: 400 });
      }
      update.monthlyPrice = price;
    }
    if (body.spotlightMode === 'preferred' || body.spotlightMode === 'random') {
      update.spotlightMode = body.spotlightMode;
    }
    if (Array.isArray(body.preferredIds)) {
      update.preferredIds = body.preferredIds.map(String);
    }
    if (body.randomCount !== undefined) {
      const count = Math.floor(Number(body.randomCount));
      if (!Number.isFinite(count) || count < 0) {
        return NextResponse.json({ error: 'Random count must be 0 or more' }, { status: 400 });
      }
      update.randomCount = count;
      update.randomWeekKey = '';
    }
    if (body.reshuffle === true) {
      update.randomWeekKey = '';
    }

    await ContentAccessSetting.updateOne({ _id: library }, { $set: update }, { upsert: true });
    return NextResponse.json(await describe(library));
  } catch {
    return NextResponse.json({ error: 'Failed to save access settings' }, { status: 500 });
  }
}
