/**
 * Coupon delivery helpers — assign coupons to clients and enforce access.
 */

import { Types } from 'mongoose';
import { CouponDelivery, DiscountCode, Order } from '@/lib/db/models';
import type { IDiscountCode } from '@/lib/db/models/DiscountCode';

type DiscountDoc = IDiscountCode & {
  _id: Types.ObjectId;
  isValid?: () => boolean;
};

function discountIsValid(doc: DiscountDoc): boolean {
  if (typeof doc.isValid === 'function') return doc.isValid();
  const now = new Date();
  return (
    doc.active &&
    now >= doc.validFrom &&
    now <= doc.validUntil &&
    (doc.usageLimit === undefined || doc.usageCount < doc.usageLimit)
  );
}

export async function assertCouponAccessibleToUser(
  userId: Types.ObjectId,
  discountCodeId: Types.ObjectId
): Promise<void> {
  const assignedCount = await CouponDelivery.countDocuments({ discountCodeId });
  if (assignedCount === 0) return;

  const mine = await CouponDelivery.findOne({ discountCodeId, userId });
  if (!mine) {
    throw new Error('This coupon was not sent to your account.');
  }
}

export async function userHasUsedCoupon(
  userId: Types.ObjectId,
  codeUpper: string
): Promise<boolean> {
  const used = await Order.countDocuments({
    userId,
    $or: [{ discountCode: codeUpper }, { discountCodes: codeUpper }],
  });
  return used > 0;
}

export async function getValidSentCouponsForUser(userId: Types.ObjectId) {
  const deliveries = await CouponDelivery.find({ userId })
    .sort({ sentAt: -1 })
    .lean();

  if (deliveries.length === 0) return [];

  const codeIds = deliveries.map((d) => d.discountCodeId);
  const codes = await DiscountCode.find({ _id: { $in: codeIds } }).lean();
  const codeById = new Map(codes.map((c) => [String(c._id), c as DiscountDoc]));

  const results = [];
  for (const delivery of deliveries) {
    const doc = codeById.get(String(delivery.discountCodeId));
    if (!doc || !discountIsValid(doc)) continue;
    if (doc.oneTimePerUser && (await userHasUsedCoupon(userId, doc.code.toUpperCase()))) {
      continue;
    }

    results.push({
      id: String(doc._id),
      code: doc.code,
      description: doc.description,
      type: doc.type,
      value: doc.value,
      minOrderAmount: doc.minOrderAmount,
      maxDiscount: doc.maxDiscount,
      validFrom: doc.validFrom,
      validUntil: doc.validUntil,
      stackable: doc.stackable,
      oneTimePerUser: doc.oneTimePerUser,
      sentAt: delivery.sentAt,
    });
  }

  return results;
}

export { formatCouponValue } from './formatCoupon';
