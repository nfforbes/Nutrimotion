/**
 * Sidebar Component
 * Supports multiple roles with organized sections
 */

'use client';

import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Box,
  Typography,
  Collapse
} from '@mui/material';
import * as Icons from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MenuItem } from '@/types/menu';
import { useState } from 'react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
}

export default function Sidebar({ open, onClose, menuItems }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent /> : <Icons.Circle />;
  };
  
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };
  
  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const isActive = pathname === item.route;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    
    return (
      <Box key={item.id}>
        <ListItem disablePadding sx={{ pl: depth * 2 }}>
          <ListItemButton
            component={hasChildren ? 'div' : Link}
            href={hasChildren ? undefined : item.route}
            selected={isActive}
            onClick={() => {
              if (hasChildren) {
                toggleExpanded(item.id);
              } else {
                onClose();
              }
            }}
          >
            <ListItemIcon>{getIcon(item.icon)}</ListItemIcon>
            <ListItemText primary={item.label} />
            {hasChildren && (
              isExpanded ? <Icons.ExpandLess /> : <Icons.ExpandMore />
            )}
          </ListItemButton>
        </ListItem>
        
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map(child => renderMenuItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };
  
  // Group menu items by section for better organization
  const publicItems = menuItems.filter(item => 
    !item.route.startsWith('/admin') && 
    !item.route.startsWith('/driver') && 
    !item.route.startsWith('/client')
  );
  
  const clientItems = menuItems.filter(item => 
    item.route.startsWith('/client') || item.id === 'cart'
  );
  
  const adminItems = menuItems.filter(item => 
    item.route.startsWith('/admin')
  );
  
  const driverItems = menuItems.filter(item => 
    item.route.startsWith('/driver')
  );
  
  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 280 }} role="presentation">
        {/* Public Pages */}
        {publicItems.length > 0 && (
          <>
            <Typography variant="overline" sx={{ px: 2, pt: 2, pb: 1, color: 'text.secondary' }}>
              Browse
            </Typography>
            <List>
              {publicItems.map((item) => renderMenuItem(item))}
            </List>
            <Divider />
          </>
        )}
        
        {/* Client Pages */}
        {clientItems.length > 0 && (
          <>
            <Typography variant="overline" sx={{ px: 2, pt: 2, pb: 1, color: 'text.secondary' }}>
              My Account
            </Typography>
            <List>
              {clientItems.map((item) => renderMenuItem(item))}
            </List>
            <Divider />
          </>
        )}
        
        {/* Admin Pages */}
        {adminItems.length > 0 && (
          <>
            <Typography variant="overline" sx={{ px: 2, pt: 2, pb: 1, color: 'error.main', fontWeight: 600 }}>
              Administration
            </Typography>
            <List>
              {adminItems.map((item) => renderMenuItem(item))}
            </List>
            <Divider />
          </>
        )}
        
        {/* Driver Pages */}
        {driverItems.length > 0 && (
          <>
            <Typography variant="overline" sx={{ px: 2, pt: 2, pb: 1, color: 'primary.main', fontWeight: 600 }}>
              Driver Portal
            </Typography>
            <List>
              {driverItems.map((item) => renderMenuItem(item))}
            </List>
          </>
        )}
      </Box>
    </Drawer>
  );
}
