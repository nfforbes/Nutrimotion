/**
 * App store payment rules: books and recipe/video subscriptions are digital goods, which the
 * iOS and Android apps can't sell without In-App Purchase / Play Billing.
 */

import type { NextRequest } from 'next/server';

export const DIGITAL_ITEM_TYPES = new Set(['book', 'subscription']);

/** True when the request comes from the Nutrimotion iOS or Android app. */
export function isMobileAppRequest(request: NextRequest): boolean {
  const client = request.headers.get('x-nutrimotion-client')?.toLowerCase();
  return client === 'ios' || client === 'android';
}

export const MOBILE_DIGITAL_ERROR =
  "Books and subscriptions can't be bought in the app. Remove them from your cart to check out.";
