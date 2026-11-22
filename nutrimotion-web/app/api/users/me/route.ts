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
import { deleteAuth0User } from '@/lib/auth/auth0Management';

const FINISHED_STATUSES = [OrderStatus.DELIVERED, OrderStatus.CANCELLED];

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
