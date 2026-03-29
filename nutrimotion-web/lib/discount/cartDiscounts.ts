/**
 * Cart discount recalculation: stacking, one-time-per-user, min order.
 */

import mongoose, { Types } from 'mongoose';
import { Cart, DiscountCode, Order } from '@/lib/db/models';
import type { ICart } from '@/lib/db/models/Cart';

type CartWithCodes = ICart & {
  appliedDiscountCodes?: string[];
  discountCode?: string;
};

export function getAppliedCodesFromCart(cart: CartWithCodes): string[] {
  if (cart.appliedDiscountCodes && cart.appliedDiscountCodes.length > 0) {
    return cart.appliedDiscountCodes.map((c) => c.toUpperCase());
  }
  if (cart.discountCode) {
    return [cart.discountCode.toUpperCase()];
  }
  return [];
}

export async function assertUserMayUseCode(
  userId: Types.ObjectId,
  codeUpper: string
): Promise<void> {
  const doc = await DiscountCode.findOne({ code: codeUpper });
  if (!doc || !(doc as { oneTimePerUser?: boolean }).oneTimePerUser) return;

  const used = await Order.countDocuments({
    userId,
    $or: [{ discountCode: codeUpper }, { discountCodes: codeUpper }],
  });
  if (used > 0) {
    throw new Error('This coupon can only be used once per account.');
  }
}

async function validateStacking(existingCodesUpper: string[], newDoc: { stackable?: boolean; code: string }): Promise<void> {
  const newUpper = newDoc.code.toUpperCase();
  if (existingCodesUpper.includes(newUpper)) return;
  if (existingCodesUpper.length === 0) return;
  if (!newDoc.stackable) {
    throw new Error('This coupon cannot be combined with others. Remove existing coupons first.');
  }
  for (const c of existingCodesUpper) {
    const d = await DiscountCode.findOne({ code: c });
    if (d && !(d as { stackable?: boolean }).stackable) {
      throw new Error(`Coupon ${c} cannot be combined with others. Remove it before adding another.`);
    }
  }
}

/**
 * Recompute cart.discount from applied codes (sequential on remaining balance).
 * Mutates cart fields; caller must save.
 */
export async function recalculateCartDiscounts(cart: CartWithCodes, userId: Types.ObjectId): Promise<void> {
  const codes = getAppliedCodesFromCart(cart);
  if (codes.length === 0) {
    cart.discount = 0;
    cart.discountCode = undefined;
    cart.appliedDiscountCodes = [];
    return;
  }

  const loaded: Array<{
    isValid: () => boolean;
    calculateDiscount: (subtotal: number) => number;
    minOrderAmount?: number;
    code: string;
  }> = [];

  for (const c of codes) {
    const doc = await DiscountCode.findOne({ code: c, active: true });
    if (!doc) {
      throw new Error(`Coupon ${c} is no longer valid.`);
    }
    const m = doc as unknown as {
      isValid: () => boolean;
      calculateDiscount: (subtotal: number) => number;
      minOrderAmount?: number;
      code: string;
    };
    if (!m.isValid()) {
      throw new Error(`Coupon ${c} has expired or is no longer available.`);
    }
    await assertUserMayUseCode(userId, c);
    if (m.minOrderAmount != null && cart.subtotal < m.minOrderAmount) {
      throw new Error(
        `Order subtotal must be at least $${m.minOrderAmount.toFixed(2)} to use coupon ${c}.`
      );
    }
    loaded.push(m);
  }

  if (loaded.length > 1) {
    for (const d of loaded) {
      const full = await DiscountCode.findOne({ code: d.code.toUpperCase() });
      if (full && !(full as { stackable?: boolean }).stackable) {
        throw new Error('One of the applied coupons cannot be combined with others.');
      }
    }
  }

  let remaining = cart.subtotal;
  let totalDiscount = 0;
  for (const doc of loaded) {
    const d = Math.min(doc.calculateDiscount(remaining), remaining);
    totalDiscount += d;
    remaining -= d;
  }

  cart.discount = Math.min(totalDiscount, cart.subtotal);
  cart.appliedDiscountCodes = [...codes];
  cart.discountCode = codes[0];
}

export async function applyCouponCodeToCart(
  cart: CartWithCodes,
  userId: Types.ObjectId,
  rawCode: string
): Promise<void> {
  const trimmed = rawCode.trim();
  if (!trimmed) {
    throw new Error('Coupon code is required.');
  }

  const codeUpper = trimmed.toUpperCase();
  const existing = getAppliedCodesFromCart(cart);

  if (existing.includes(codeUpper)) {
    await recalculateCartDiscounts(cart, userId);
    return;
  }

  const newDoc = await DiscountCode.findOne({ code: codeUpper, active: true });
  if (!newDoc) {
    throw new Error('Invalid or inactive coupon code.');
  }

  await validateStacking(existing, newDoc as { stackable?: boolean; code: string });

  const nextCodes = [...existing, codeUpper];
  cart.appliedDiscountCodes = nextCodes;
  cart.discountCode = nextCodes[0];

  await recalculateCartDiscounts(cart, userId);
}

export async function clearCartDiscounts(cart: CartWithCodes): Promise<void> {
  cart.appliedDiscountCodes = [];
  cart.discountCode = undefined;
  cart.discount = 0;
}

/** After cart items change, re-run discounts so totals stay valid. */
export async function refreshDiscountsIfNeeded(
  cartId: mongoose.Types.ObjectId | string
): Promise<void> {
  const cart = await Cart.findById(cartId);
  if (!cart) return;
  const codes = getAppliedCodesFromCart(cart as CartWithCodes);
  if (codes.length === 0) return;

  const userId = cart.userId as Types.ObjectId;
  try {
    await recalculateCartDiscounts(cart as CartWithCodes, userId);
    await cart.save();
  } catch {
    await clearCartDiscounts(cart as CartWithCodes);
    await cart.save();
  }
}

export function cartToResponse(cart: CartWithCodes & { _id: unknown; items: unknown[] }) {
  const codes = getAppliedCodesFromCart(cart);
  return {
    id: String(cart._id),
    userId: String(cart.userId),
    items: cart.items.map((item: any) => ({
      id: item._id?.toString(),
      itemType: item.itemType,
      itemId: item.itemId.toString(),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
      packageDetails: item.packageDetails,
    })),
    subtotal: cart.subtotal,
    discount: cart.discount,
    total: cart.total,
    discountCode: codes[0] ?? undefined,
    discountCodes: codes,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}
