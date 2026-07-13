/**
 * Client-safe coupon formatting helpers (no server/db imports).
 */

export function formatCouponValue(type: 'percentage' | 'fixed', value: number): string {
  return type === 'percentage' ? `${value}% off` : `$${value.toFixed(2)} off`;
}
