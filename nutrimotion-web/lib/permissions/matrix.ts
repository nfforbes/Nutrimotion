/**
 * Role-Permission Matrix
 * Defines which permissions each role has
 */

import { UserRole, Permission } from '@/types/auth';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMINISTRATOR]: [
    // All permissions
    Permission.VIEW_HOME,
    Permission.VIEW_TRAINING,
    Permission.VIEW_MEALS,
    Permission.VIEW_BOOKS,
    Permission.VIEW_RECIPES,
    Permission.VIEW_VIDEOS,
    Permission.MANAGE_CART,
    Permission.CHECKOUT,
    Permission.APPLY_DISCOUNT,
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    Permission.VIEW_ORDERS,
    Permission.VIEW_SUBSCRIPTIONS,
    Permission.TRACK_DELIVERY,
    Permission.ADMIN_DASHBOARD,
    Permission.MANAGE_MEALS,
    Permission.MANAGE_PACKAGES,
    Permission.MANAGE_TRAINING,
    Permission.MANAGE_BOOKS,
    Permission.MANAGE_RECIPES,
    Permission.MANAGE_VIDEOS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_ORDERS,
    Permission.ASSIGN_DRIVERS,
    Permission.UPDATE_DELIVERY_STATUS,
    Permission.VIEW_ANALYTICS,
  ],
  
  [UserRole.CLIENT]: [
    // Public and client-specific permissions
    Permission.VIEW_HOME,
    Permission.VIEW_TRAINING,
    Permission.VIEW_MEALS,
    Permission.VIEW_BOOKS,
    Permission.VIEW_RECIPES,
    Permission.VIEW_VIDEOS,
    Permission.MANAGE_CART,
    Permission.CHECKOUT,
    Permission.APPLY_DISCOUNT,
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    Permission.VIEW_ORDERS,
    Permission.VIEW_SUBSCRIPTIONS,
    Permission.TRACK_DELIVERY,
  ],
  
  [UserRole.DRIVER]: [
    // Driver-specific permissions
    Permission.VIEW_HOME,
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    Permission.DRIVER_DASHBOARD,
    Permission.VIEW_ASSIGNMENTS,
    Permission.UPDATE_LOCATION,
    Permission.UPDATE_DELIVERY,
    Permission.VIEW_CLIENT_INFO,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if any of the user's roles has a specific permission
 */
export function userHasPermission(roles: UserRole[], permission: Permission): boolean {
  return roles.some(role => hasPermission(role, permission));
}

/**
 * Get all permissions for a set of roles
 */
export function getPermissionsForRoles(roles: UserRole[]): Permission[] {
  const permissionsSet = new Set<Permission>();
  
  roles.forEach(role => {
    ROLE_PERMISSIONS[role]?.forEach(permission => {
      permissionsSet.add(permission);
    });
  });
  
  return Array.from(permissionsSet);
}

/**
 * Check if user has all required permissions
 */
export function userHasAllPermissions(
  userRoles: UserRole[],
  requiredPermissions: Permission[]
): boolean {
  const userPermissions = getPermissionsForRoles(userRoles);
  return requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );
}
