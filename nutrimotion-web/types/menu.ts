/**
 * Menu and Navigation Types
 */

import { Permission } from './auth';

export interface MenuItem {
  id: string;
  label: string;
  icon: string; // Material UI icon name
  route: string;
  requiredPermissions: Permission[];
  children?: MenuItem[];
  order: number;
  isVisible?: boolean; // Dynamic visibility based on content availability
}

export interface MenuConfig {
  items: MenuItem[];
}
