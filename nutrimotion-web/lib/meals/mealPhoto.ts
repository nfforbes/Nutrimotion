/**
 * Meal photos live in Vercel Blob; every day of a meal (same name) shares one photo.
 */

import { del, issueSignedToken, presignUrl } from '@vercel/blob';
import connectDB from '@/lib/db/connection';
import { MealPackage } from '@/lib/db/models';

export const MEAL_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const MEAL_PHOTO_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com';

function isOurBlob(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

export function slugifyMealName(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'meal'
  );
}

/** Sets (or clears, when imageUrl is empty) the photo on every day of a meal and deletes photos no meal uses. */
export async function setMealPhoto(name: string, imageUrl: string): Promise<number> {
  await connectDB();
  const previous: string[] = (await MealPackage.distinct('imageUrl', { name })).filter(
    (url: unknown): url is string => typeof url === 'string' && url !== '' && url !== imageUrl
  );

  const result = await MealPackage.updateMany(
    { name },
    imageUrl ? { $set: { imageUrl } } : { $unset: { imageUrl: 1 } }
  );

  const orphaned: string[] = [];
  for (const url of previous) {
    if (isOurBlob(url) && !(await MealPackage.exists({ imageUrl: url }))) orphaned.push(url);
  }
  if (orphaned.length > 0) {
    await del(orphaned).catch((error) => console.error('Meal photo cleanup failed:', error));
  }
  return result.modifiedCount;
}

/** One-time URL a client can PUT a meal photo to; responds with JSON containing the public `url`. */
export async function createMealPhotoUploadUrl(mealName: string, contentType: string): Promise<string> {
  const pathname = `meals/${slugifyMealName(mealName)}.${MEAL_PHOTO_TYPES[contentType]}`;
  const allowedContentTypes = [contentType];
  const token = await issueSignedToken({
    pathname,
    operations: ['put'],
    allowedContentTypes,
    maximumSizeInBytes: MEAL_PHOTO_MAX_BYTES,
    validUntil: Date.now() + 10 * 60 * 1000,
  });
  const { presignedUrl } = await presignUrl(token, {
    operation: 'put',
    pathname,
    access: 'public',
    addRandomSuffix: true,
    allowedContentTypes,
    maximumSizeInBytes: MEAL_PHOTO_MAX_BYTES,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });
  return presignedUrl;
}
