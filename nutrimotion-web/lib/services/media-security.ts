/**
 * Media Security Service
 * Handles secure media delivery with signed URLs and device binding
 */

import crypto from 'crypto';

const MEDIA_SECRET = process.env.MEDIA_SECRET || 'default-media-secret-change-in-production';
const TOKEN_EXPIRY_HOURS = 24;

export interface SecureMediaToken {
  url: string;
  expiresAt: Date;
  deviceId?: string;
}

/**
 * Generate a signed URL for secure media access
 */
export function generateSignedUrl(
  mediaPath: string,
  userId: string,
  deviceId?: string
): SecureMediaToken {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);
  
  const payload = {
    mediaPath,
    userId,
    deviceId,
    expiresAt: expiresAt.getTime(),
  };
  
  const signature = crypto
    .createHmac('sha256', MEDIA_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  const token = Buffer.from(
    JSON.stringify({ ...payload, signature })
  ).toString('base64url');
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3030';
  const url = `${baseUrl}/api/media/${token}`;
  
  return {
    url,
    expiresAt,
    deviceId,
  };
}

/**
 * Verify a signed URL token
 */
export function verifySignedToken(
  token: string
): { valid: boolean; payload?: any; error?: string } {
  try {
    const decoded = JSON.parse(
      Buffer.from(token, 'base64url').toString('utf-8')
    );
    
    const { signature, ...payload } = decoded;
    
    // Verify expiration
    if (payload.expiresAt < Date.now()) {
      return { valid: false, error: 'Token expired' };
    }
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', MEDIA_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: 'Invalid token' };
  }
}

/**
 * Register a device for content access
 */
export function registerDevice(userId: string, deviceInfo: any): string {
  const deviceFingerprint = crypto
    .createHash('sha256')
    .update(JSON.stringify({ userId, ...deviceInfo, timestamp: Date.now() }))
    .digest('hex');
  
  // In production, store this in the database with user association
  return deviceFingerprint;
}

/**
 * Verify device access
 */
export function verifyDeviceAccess(
  userId: string,
  deviceId: string,
  registeredDevices: string[]
): boolean {
  return registeredDevices.includes(deviceId);
}

/**
 * Add watermark metadata to content
 */
export function addWatermark(userId: string, contentId: string): string {
  const watermark = crypto
    .createHash('md5')
    .update(`${userId}-${contentId}-${Date.now()}`)
    .digest('hex');
  
  return watermark;
}

/**
 * Generate DRM license request
 * This is a placeholder for actual DRM integration
 */
export interface DRMConfig {
  platform: 'fairplay' | 'widevine' | 'playready';
  contentId: string;
  userId: string;
  deviceId: string;
}

export function generateDRMLicense(config: DRMConfig): {
  licenseUrl: string;
  certificateUrl?: string;
  token: string;
} {
  // In production, this would integrate with actual DRM providers:
  // - Apple FairPlay Streaming
  // - Google Widevine
  // - Microsoft PlayReady
  
  const token = crypto
    .createHmac('sha256', MEDIA_SECRET)
    .update(JSON.stringify(config))
    .digest('hex');
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3030';
  
  return {
    licenseUrl: `${baseUrl}/api/drm/${config.platform}/license`,
    certificateUrl:
      config.platform === 'fairplay'
        ? `${baseUrl}/api/drm/fairplay/certificate`
        : undefined,
    token,
  };
}
