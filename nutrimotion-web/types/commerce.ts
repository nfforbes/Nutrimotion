/**
 * Commerce and Transaction Types
 */

export enum OrderStatus {
  PENDING = 'pending',
  PURCHASED = 'purchased',
  PREPARING = 'preparing',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  discountCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  cartId: string;
  itemType: 'meal' | 'training' | 'book' | 'subscription' | 'package';
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  packageDetails?: {
    [dateIso: string]: {
      breakfast?: string[];
      lunch?: string[];
      dinner?: string[];
    };
  };
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  discountCode?: string;
  status: OrderStatus;
  deliveryAddress?: {
    street: string;
    parish: string;
  };
  deliveryInstructions?: string;
  assignedDriverId?: string;
  statusHistory: OrderStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  itemType: 'meal' | 'training' | 'book' | 'subscription' | 'package';
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  packageDetails?: {
    [dateIso: string]: {
      breakfast?: string[];
      lunch?: string[];
      dinner?: string[];
    };
  };
}

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
  updatedBy?: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usageCount: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  type: 'recipes' | 'videos' | 'training';
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  price: number;
  billingInterval: 'monthly' | 'quarterly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
}
