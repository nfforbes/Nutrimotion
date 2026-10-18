/**
 * Account deletion (App Store guideline 5.1.1(v)).
 * Removes the signed-in user's account and personal data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/lib/db/connection';
import {
  User,
  Cart,
  Order,
  Subscription,
  PushDevice,
  CouponDelivery,
} from '@/lib/db/models';
import { OrderStatus } from '@/types/commerce';

const FINISHED_STATUSES = [OrderStatus.DELIVERED, OrderStatus.CANCELLED];

function auth0Domain(): string {
  const raw = process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL || '';
  return raw.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/** Deletes the Auth0 login when Management API credentials are configured. */
async function deleteAuth0User(auth0Sub: string): Promise<boolean> {
  const clientId = process.env.AUTH0_MANAGEMENT_CLIENT_ID;
  const clientSecret = process.env.AUTH0_MANAGEMENT_CLIENT_SECRET;
  const domain = auth0Domain();
  if (!clientId || !clientSecret || !domain) return false;

  try {
    const tokenRes = await fetch(`https://${domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        audience: `https://${domain}/api/v2/`,
      }),
    });
    if (!tokenRes.ok) {
      console.warn('[account-delete] Auth0 token request failed:', tokenRes.status);
      return false;
    }
    const { access_token } = await tokenRes.json();

    const delRes = await fetch(
      `https://${domain}/api/v2/users/${encodeURIComponent(auth0Sub)}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${access_token}` } }
    );
    if (!delRes.ok && delRes.status !== 404) {
      console.warn('[account-delete] Auth0 user delete failed:', delRes.status);
      return false;
    }
    return true;
  } catch (error) {
    console.warn('[account-delete] Auth0 user delete error:', (error as Error)?.message);
    return false;
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const auth0Sub = authResult.session.user.sub;
    const user = await User.findOne({ auth0Sub });

    if (user) {
      const userId = user._id;
      await Promise.all([
        Cart.deleteMany({ userId }),
        Subscription.deleteMany({ userId }),
        PushDevice.deleteMany({ userId }),
        CouponDelivery.deleteMany({ userId }),
        // Finished orders stay for bookkeeping without personal details.
        // Orders still in progress keep their address so they can be delivered.
        Order.updateMany(
          { userId, status: { $in: FINISHED_STATUSES } },
          { $unset: { deliveryAddress: 1, deliveryInstructions: 1 } }
        ),
      ]);
      await User.deleteOne({ _id: userId });
    }

    const auth0Deleted = await deleteAuth0User(auth0Sub);

    return NextResponse.json({ deleted: true, auth0Deleted });
  } catch (error) {
    console.error('[account-delete] Failed:', (error as Error)?.message);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
