/**
 * Subscription plans — monthly prices for recipes and videos, and whether this user is subscribed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/lib/db/connection';
import { getAccessSetting, hasActiveSubscription } from '@/lib/content/access';

const PLANS = [
  { type: 'recipes' as const, label: 'Recipes' },
  { type: 'videos' as const, label: 'Videos' },
];

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { session } = authResult;

    const plans = await Promise.all(
      PLANS.map(async (plan) => {
        const setting = await getAccessSetting(plan.type);
        return {
          type: plan.type,
          label: plan.label,
          monthlyPrice: setting.monthlyPrice ?? 0,
          subscribed: await hasActiveSubscription(session.user.sub, plan.type),
        };
      })
    );

    return NextResponse.json(plans);
  } catch {
    return NextResponse.json({ error: 'Failed to load plans' }, { status: 500 });
  }
}
