/**
 * Delivery and Tracking Types
 */

import { OrderStatus } from './commerce';

export interface DeliveryBatch {
  id: string;
  mealId: string;
  mealName: string;
  scheduledDate: Date;
  slot: 'breakfast' | 'lunch' | 'dinner';
  totalOrders: number;
  status: 'pending' | 'preparing' | 'ready' | 'dispatched' | 'completed';
  assignments: DeliveryAssignment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryAssignment {
  id: string;
  batchId: string;
  orderId: string;
  driverId: string;
  driverName: string;
  customerName: string;
  customerPhone: string;
  customerAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  status: OrderStatus;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  assignedAt: Date;
  startedAt?: Date;
  arrivedAt?: Date;
  deliveredAt?: Date;
}

export interface DeliveryTrackingPoint {
  id: string;
  assignmentId: string;
  driverId: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
  speed?: number;
  heading?: number;
}

export interface DriverLocation {
  driverId: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
  activeDeliveryId?: string;
}
