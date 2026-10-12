/**
 * Browser-only: uploads a meal photo straight to Vercel Blob and returns the public URL.
 * Images up to 5 MB are uploaded untouched; larger ones (or formats the store doesn't accept)
 * are re-encoded as JPEG and scaled down until they fit.
 */

import { upload } from '@vercel/blob/client';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const PASS_THROUGH: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface MealPhotoUploadResult {
  url: string;
  reduced: boolean;
  originalBytes: number;
  finalBytes: number;
}

async function encodeJpeg(bitmap: ImageBitmap, maxEdge: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot process images.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not prepare the image.'))),
      'image/jpeg',
      quality
    )
  );
}

async function reduceToLimit(file: Blob): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error("This image format isn't supported here. Please use a JPG, PNG or WebP image.");
  }
  try {
    let maxEdge = Math.min(Math.max(bitmap.width, bitmap.height), 3000);
    let quality = 0.9;
    for (let attempt = 0; attempt < 12; attempt++) {
      const blob = await encodeJpeg(bitmap, maxEdge, quality);
      if (blob.size <= MAX_UPLOAD_BYTES) return blob;
      if (quality > 0.72) quality -= 0.06;
      else maxEdge = Math.round(maxEdge * 0.8);
    }
    throw new Error('Could not reduce the image below 5 MB.');
  } finally {
    bitmap.close();
  }
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'meal'
  );
}

export async function uploadMealPhoto(file: Blob, mealName: string): Promise<MealPhotoUploadResult> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');

  const passThroughExt = PASS_THROUGH[file.type];
  const keepOriginal = Boolean(passThroughExt) && file.size <= MAX_UPLOAD_BYTES;
  const body = keepOriginal ? file : await reduceToLimit(file);
  const contentType = keepOriginal ? file.type : 'image/jpeg';
  const ext = keepOriginal ? passThroughExt : 'jpg';

  const result = await upload(`meals/${slugify(mealName)}.${ext}`, body, {
    access: 'public',
    contentType,
    handleUploadUrl: '/api/admin/uploads/meal-photo',
  });
  return { url: result.url, reduced: !keepOriginal, originalBytes: file.size, finalBytes: body.size };
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
