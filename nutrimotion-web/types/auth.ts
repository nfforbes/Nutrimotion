/**
 * Authentication and Authorization Types
 */

export enum UserRole {
  ADMINISTRATOR = 'administrator',
  CLIENT = 'client',
  DRIVER = 'driver',
}

export enum Permission {
  // General
  VIEW_HOME = 'view:home',
  VIEW_TRAINING = 'view:training',
  VIEW_MEALS = 'view:meals',
  VIEW_BOOKS = 'view:books',
  VIEW_RECIPES = 'view:recipes',
  VIEW_VIDEOS = 'view:videos',
  
  // Cart & Checkout
  MANAGE_CART = 'manage:cart',
  CHECKOUT = 'checkout',
  APPLY_DISCOUNT = 'apply:discount',
  
  // Client
  VIEW_PROFILE = 'view:profile',
  EDIT_PROFILE = 'edit:profile',
  VIEW_ORDERS = 'view:orders',
  VIEW_SUBSCRIPTIONS = 'view:subscriptions',
  TRACK_DELIVERY = 'track:delivery',
  
  // Admin
  ADMIN_DASHBOARD = 'admin:dashboard',
  MANAGE_MEALS = 'manage:meals',
  MANAGE_PACKAGES = 'manage:packages',
  MANAGE_TRAINING = 'manage:training',
  MANAGE_BOOKS = 'manage:books',
  MANAGE_RECIPES = 'manage:recipes',
  MANAGE_VIDEOS = 'manage:videos',
  MANAGE_USERS = 'manage:users',
  MANAGE_ORDERS = 'manage:orders',
  MANAGE_COUPONS = 'manage:coupons',
  ASSIGN_DRIVERS = 'assign:drivers',
  UPDATE_DELIVERY_STATUS = 'update:delivery_status',
  VIEW_ANALYTICS = 'view:analytics',
  
  // Driver
  DRIVER_DASHBOARD = 'driver:dashboard',
  VIEW_ASSIGNMENTS = 'view:assignments',
  UPDATE_LOCATION = 'update:location',
  UPDATE_DELIVERY = 'update:delivery',
  VIEW_CLIENT_INFO = 'view:client_info',
}

export interface UserProfile {
  id: string;
  auth0Sub: string;
  email: string;
  name: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  roles: UserRole[];
  deviceFingerprints?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: {
    sub: string;
    email: string;
    name: string;
    picture?: string;
  };
  roles: UserRole[];
  permissions: Permission[];
}
