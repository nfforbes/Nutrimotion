/**
 * Permissions Tests
 */

import { UserRole, Permission } from '@/types/auth';
import {
  hasPermission,
  userHasPermission,
  getPermissionsForRoles,
  userHasAllPermissions,
} from '@/lib/permissions/matrix';

describe('Permission Matrix', () => {
  describe('hasPermission', () => {
    it('should return true when role has permission', () => {
      expect(hasPermission(UserRole.ADMINISTRATOR, Permission.MANAGE_MEALS)).toBe(true);
    });
    
    it('should return false when role does not have permission', () => {
      expect(hasPermission(UserRole.CLIENT, Permission.MANAGE_MEALS)).toBe(false);
    });
  });
  
  describe('userHasPermission', () => {
    it('should return true when any role has permission', () => {
      const roles = [UserRole.CLIENT, UserRole.ADMINISTRATOR];
      expect(userHasPermission(roles, Permission.MANAGE_MEALS)).toBe(true);
    });
    
    it('should return false when no role has permission', () => {
      const roles = [UserRole.CLIENT];
      expect(userHasPermission(roles, Permission.MANAGE_MEALS)).toBe(false);
    });
  });
  
  describe('getPermissionsForRoles', () => {
    it('should return unique permissions for multiple roles', () => {
      const roles = [UserRole.CLIENT, UserRole.DRIVER];
      const permissions = getPermissionsForRoles(roles);
      
      expect(permissions.length).toBeGreaterThan(0);
      expect(new Set(permissions).size).toBe(permissions.length); // No duplicates
    });
  });
  
  describe('userHasAllPermissions', () => {
    it('should return true when user has all required permissions', () => {
      const roles = [UserRole.ADMINISTRATOR];
      const required = [Permission.MANAGE_MEALS, Permission.MANAGE_ORDERS];
      
      expect(userHasAllPermissions(roles, required)).toBe(true);
    });
    
    it('should return false when user missing any permission', () => {
      const roles = [UserRole.CLIENT];
      const required = [Permission.VIEW_MEALS, Permission.MANAGE_MEALS];
      
      expect(userHasAllPermissions(roles, required)).toBe(false);
    });
  });
});
