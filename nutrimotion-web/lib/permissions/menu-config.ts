/**
 * Menu Configuration
 * Defines menu items with their permissions and icons
 */

import { MenuItem } from '@/types/menu';
import { Permission } from '@/types/auth';

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: 'Home',
    route: '/',
    requiredPermissions: [Permission.VIEW_HOME],
    order: 1,
  },
  {
    id: 'training',
    label: 'Training',
    icon: 'FitnessCenter',
    route: '/training',
    requiredPermissions: [Permission.VIEW_TRAINING],
    order: 2,
  },
  {
    id: 'meals',
    label: 'Meals',
    icon: 'Restaurant',
    route: '/meals',
    requiredPermissions: [Permission.VIEW_MEALS],
    order: 3,
  },
  {
    id: 'books',
    label: 'Books',
    icon: 'MenuBook',
    route: '/books',
    requiredPermissions: [Permission.VIEW_BOOKS],
    order: 4,
  },
  {
    id: 'recipes',
    label: 'Recipes',
    icon: 'Receipt',
    route: '/recipes',
    requiredPermissions: [Permission.VIEW_RECIPES],
    order: 5,
  },
  {
    id: 'videos',
    label: 'Videos',
    icon: 'VideoLibrary',
    route: '/videos',
    requiredPermissions: [Permission.VIEW_VIDEOS],
    order: 6,
  },
];

export const CLIENT_MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'My Dashboard',
    icon: 'Dashboard',
    route: '/client/dashboard',
    requiredPermissions: [Permission.VIEW_PROFILE],
    order: 1,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: 'Person',
    route: '/client/profile',
    requiredPermissions: [Permission.VIEW_PROFILE],
    order: 2,
  },
  {
    id: 'orders',
    label: 'My Orders',
    icon: 'ShoppingBag',
    route: '/client/orders',
    requiredPermissions: [Permission.VIEW_ORDERS],
    order: 3,
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    icon: 'Subscriptions',
    route: '/client/subscriptions',
    requiredPermissions: [Permission.VIEW_SUBSCRIPTIONS],
    order: 4,
  },
  {
    id: 'cart',
    label: 'Cart',
    icon: 'ShoppingCart',
    route: '/cart',
    requiredPermissions: [Permission.MANAGE_CART],
    order: 5,
  },
];

export const ADMIN_MENU_ITEMS: MenuItem[] = [
  {
    id: 'admin-dashboard',
    label: 'Admin Dashboard',
    icon: 'AdminPanelSettings',
    route: '/admin/dashboard',
    requiredPermissions: [Permission.ADMIN_DASHBOARD],
    order: 1,
  },
  {
    id: 'meal-management',
    label: 'Meal Management',
    icon: 'Restaurant',
    route: '/admin/meals',
    requiredPermissions: [Permission.MANAGE_MEALS],
    order: 2,
  },
  {
    id: 'packages-management',
    label: 'Packages',
    icon: 'Inventory2',
    route: '/admin/packages',
    requiredPermissions: [Permission.MANAGE_PACKAGES],
    order: 3,
  },
  {
    id: 'content-management',
    label: 'Content',
    icon: 'LibraryBooks',
    route: '/admin/content',
    requiredPermissions: [Permission.MANAGE_BOOKS],
    order: 4,
    children: [
      {
        id: 'books-management',
        label: 'Books',
        icon: 'MenuBook',
        route: '/admin/content/books',
        requiredPermissions: [Permission.MANAGE_BOOKS],
        order: 1,
      },
      {
        id: 'recipes-management',
        label: 'Recipes',
        icon: 'Receipt',
        route: '/admin/content/recipes',
        requiredPermissions: [Permission.MANAGE_RECIPES],
        order: 2,
      },
      {
        id: 'videos-management',
        label: 'Videos',
        icon: 'VideoLibrary',
        route: '/admin/content/videos',
        requiredPermissions: [Permission.MANAGE_VIDEOS],
        order: 3,
      },
      {
        id: 'training-management',
        label: 'Training Packages',
        icon: 'FitnessCenter',
        route: '/admin/content/training',
        requiredPermissions: [Permission.MANAGE_TRAINING],
        order: 4,
      },
    ],
  },
  {
    id: 'order-management',
    label: 'Orders',
    icon: 'ShoppingBag',
    route: '/admin/orders',
    requiredPermissions: [Permission.MANAGE_ORDERS],
    order: 5,
  },
  {
    id: 'delivery-management',
    label: 'Deliveries',
    icon: 'LocalShipping',
    route: '/admin/deliveries',
    requiredPermissions: [Permission.ASSIGN_DRIVERS],
    order: 6,
  },
  {
    id: 'user-management',
    label: 'Users',
    icon: 'People',
    route: '/admin/users',
    requiredPermissions: [Permission.MANAGE_USERS],
    order: 7,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'Analytics',
    route: '/admin/analytics',
    requiredPermissions: [Permission.VIEW_ANALYTICS],
    order: 8,
  },
];

export const DRIVER_MENU_ITEMS: MenuItem[] = [
  {
    id: 'driver-dashboard',
    label: 'Driver Dashboard',
    icon: 'LocalShipping',
    route: '/driver/dashboard',
    requiredPermissions: [Permission.DRIVER_DASHBOARD],
    order: 1,
  },
  {
    id: 'assignments',
    label: 'My Deliveries',
    icon: 'Assignment',
    route: '/driver/assignments',
    requiredPermissions: [Permission.VIEW_ASSIGNMENTS],
    order: 2,
  },
  {
    id: 'driver-profile',
    label: 'Profile',
    icon: 'Person',
    route: '/driver/profile',
    requiredPermissions: [Permission.VIEW_PROFILE],
    order: 3,
  },
];

/**
 * Get filtered menu items based on user permissions
 */
export function getFilteredMenuItems(
  menuItems: MenuItem[],
  userPermissions: Permission[]
): MenuItem[] {
  return menuItems
    .filter(item => {
      // Check if user has all required permissions
      const hasPermissions = item.requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );
      
      if (!hasPermissions) return false;
      
      // Filter children if they exist
      if (item.children) {
        item.children = getFilteredMenuItems(item.children, userPermissions);
        // Only show parent if it has visible children or is directly accessible
        return item.children.length > 0 || item.route;
      }
      
      return true;
    })
    .sort((a, b) => a.order - b.order);
}

/**
 * Get all menu items for a user based on their permissions
 * This combines all menu item categories (public, client, admin, driver)
 * Users with multiple roles will see menu items from all their roles
 */
export function getAllMenuItemsForUser(userPermissions: Permission[]): MenuItem[] {
  const allMenuItems = [
    ...MENU_ITEMS,        // Public pages
    ...CLIENT_MENU_ITEMS, // Client pages
    ...ADMIN_MENU_ITEMS,  // Admin pages
    ...DRIVER_MENU_ITEMS, // Driver pages
  ];
  
  return getFilteredMenuItems(allMenuItems, userPermissions);
}
