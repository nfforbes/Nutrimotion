/**
 * Application Bar Component
 * Shows user info and role badges for multi-role users.
 * When not authenticated, shows a Login button in the top right.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Button,
  Box,
  Chip,
  Menu,
  MenuItem
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import LoginIcon from '@mui/icons-material/Login';
import { useAppDispatch, useAppSelector } from '@/store';
import { useUser } from '@auth0/nextjs-auth0/client';
import { UserRole } from '@/types/auth';
import { fetchUserRequest } from '@/store/slices/authSlice';
import { fetchCartRequest } from '@/store/slices/cartSlice';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AppBarProps {
  onMenuClick?: () => void;
}

export default function AppBar({ onMenuClick }: AppBarProps) {
  const { user, isLoading } = useUser();
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const cart = useAppSelector((state) => state.cart.cart);
  const auth = useAppSelector((state) => state.auth);
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const isAuthenticated = !!user || auth.isAuthenticated;
  const bootstrappedRef = useRef(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      bootstrappedRef.current = false;
      return;
    }
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    dispatch(fetchUserRequest());
    dispatch(fetchCartRequest());
  }, [dispatch, isAuthenticated]);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMINISTRATOR:
        return <AdminPanelSettingsIcon sx={{ fontSize: 16 }} />;
      case UserRole.DRIVER:
        return <LocalShippingIcon sx={{ fontSize: 16 }} />;
      case UserRole.CLIENT:
        return <PersonIcon sx={{ fontSize: 16 }} />;
      default:
        return null;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMINISTRATOR:
        return 'error';
      case UserRole.DRIVER:
        return 'info';
      case UserRole.CLIENT:
        return 'default';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMINISTRATOR:
        return 'Admin';
      case UserRole.DRIVER:
        return 'Driver';
      case UserRole.CLIENT:
        return 'Client';
      default:
        return role;
    }
  };

  const isHomePage = pathname === '/';

  return (
    <MuiAppBar 
      position={isHomePage ? 'absolute' : 'static'}
      sx={{
        position: isHomePage ? 'absolute' : 'static !important',
        ...(isHomePage ? {
          top: { xs: 10, md: 20 },
          left: '50%',
          transform: 'translateX(-50%)',
          width: { xs: '95%', md: '90%' },
          maxWidth: 1200,
        } : {
          top: 0,
          mb: { xs: 6, md: 6 },
          zIndex: 1100,
        }),
        borderRadius: isHomePage ? '100px' : 0,
        bgcolor: isHomePage ? 'transparent' : '#121212',
        color: '#ffffff',
        border: isHomePage ? '1px solid #000000' : 'none',
        boxShadow: isHomePage ? 'none' : '0 4px 20px rgba(0,0,0,0.1)',
      }}
    >
      <Toolbar>
        {isAuthenticated && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Box component={Link} href={isAuthenticated ? '/dashboard' : '/'} sx={{ display: 'flex', alignItems: 'center', mr: 3, flexShrink: 0 }}>
          <Box
            component="img"
            src="/nutrimotion-logo.png"
            alt="Nutrimotion"
            sx={{ height: 56, display: 'block' }}
          />
        </Box>

        {/* Top nav: Meals, Training, Books, Recipes - only when not logged in */}
        {!isAuthenticated && (
          <>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, alignItems: 'center', flexWrap: 'nowrap', ml: 1 }}>
              <Button color="inherit" component={Link} href="/meals" size="small" sx={{ minWidth: 'auto', px: 1.5 }}>
                Meals
              </Button>
              <Button color="inherit" component={Link} href="/training" size="small" sx={{ minWidth: 'auto', px: 1.5 }}>
                Training
              </Button>
              <Button color="inherit" component={Link} href="/books" size="small" sx={{ minWidth: 'auto', px: 1.5 }}>
                Books
              </Button>
              <Button color="inherit" component={Link} href="/recipes" size="small" sx={{ minWidth: 'auto', px: 1.5 }}>
                Recipes
              </Button>
            </Box>
            
            {/* Mobile hamburger menu for non-authenticated */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, ml: 1 }}>
              <IconButton color="inherit" onClick={handleMenuClick} edge="start" sx={{ ml: 0 }}>
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                MenuListProps={{ 'aria-labelledby': 'basic-button' }}
                sx={{ mt: 1 }}
              >
                <MenuItem component={Link} href="/meals" onClick={handleMenuClose}>Meals</MenuItem>
                <MenuItem component={Link} href="/training" onClick={handleMenuClose}>Training</MenuItem>
                <MenuItem component={Link} href="/books" onClick={handleMenuClose}>Books</MenuItem>
                <MenuItem component={Link} href="/recipes" onClick={handleMenuClose}>Recipes</MenuItem>
              </Menu>
            </Box>
          </>
        )}

        <Box sx={{ flexGrow: 1 }} />
        {/* Role Badges - Show all user's roles */}
        {auth.roles && auth.roles.length > 0 && (
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mr: 2 }}>
            {auth.roles.map((role) => (
              <Chip
                key={role}
                icon={getRoleIcon(role) ?? undefined}
                label={getRoleLabel(role)}
                color={getRoleColor(role)}
                size="small"
                sx={{
                  fontWeight: 600,
                  color: 'white',
                }}
              />
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {!isLoading && !isAuthenticated ? (
            <Button
              variant="contained"
              href="/auth/login?returnTo=/dashboard"
              component={Link}
              sx={{ 
                bgcolor: '#ee4d24 !important',
                color: '#ffffff !important',
                minWidth: { xs: 'auto', md: 64 },
                px: { xs: 1, md: 2 },
                py: { xs: 1, md: 0.5 },
                '&:hover': { bgcolor: '#da451f !important' } 
              }}
              aria-label="Login"
            >
              <LoginIcon sx={{ mr: { xs: 0, md: 1 } }} />
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' }, fontWeight: 500, textTransform: 'uppercase', fontSize: '0.875rem' }}>
                Login
              </Box>
            </Button>
          ) : (
            <>
              <IconButton color="inherit" component={Link} href="/cart">
                <Badge badgeContent={itemCount} color="secondary">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>

              <IconButton color="inherit" component={Link} href="/client/profile">
                <AccountCircle />
              </IconButton>

              <Button color="inherit" href="/auth/logout">
                Logout
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
}
