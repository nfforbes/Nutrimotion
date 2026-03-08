/**
 * Application Bar Component
 * Shows user info and role badges for multi-role users.
 * When not authenticated, shows a Login button in the top right.
 */

'use client';

import { useEffect, useRef } from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Button,
  Box,
  Chip
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

interface AppBarProps {
  onMenuClick?: () => void;
}

export default function AppBar({ onMenuClick }: AppBarProps) {
  const { user, isLoading } = useUser();
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) => state.cart.cart);
  const auth = useAppSelector((state) => state.auth);
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const isAuthenticated = !!user || auth.isAuthenticated;
  const bootstrappedRef = useRef(false);

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

  return (
    <MuiAppBar position="sticky">
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
        <Typography variant="h6" component={Link} href={isAuthenticated ? "/dashboard" : "/"} sx={{ textDecoration: 'none', color: 'inherit', mr: 3, flexShrink: 0 }}>
          Nutrimotion
        </Typography>

        {/* Top nav: Meals, Training, Books, Recipes - only when not logged in */}
        {!isAuthenticated && (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'nowrap', ml: 1 }}>
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
        )}

        <Box sx={{ flexGrow: 1 }} />
        {/* Role Badges - Show all user's roles */}
        {auth.roles && auth.roles.length > 0 && (
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mr: 2 }}>
            {auth.roles.map((role) => (
              <Chip
                key={role}
                icon={getRoleIcon(role)}
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
              color="inherit"
              variant="outlined"
              startIcon={<LoginIcon />}
              href="/auth/login?returnTo=/dashboard"
              component={Link}
              sx={{ borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' } }}
            >
              Login
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
