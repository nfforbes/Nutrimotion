/**
 * Dashboard Page
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  CircularProgress
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchUserRequest } from '@/store/slices/authSlice';
import { fetchCartRequest } from '@/store/slices/cartSlice';
import { fetchOrdersRequest } from '@/store/slices/orderSlice';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import { OrderStatus as statusTypes } from '@/types/commerce';
import Link from 'next/link';
import ClientCouponsPanel from '@/components/client/ClientCouponsPanel';

// Nutrimotion brand color scheme
const BRAND_COLORS = {
  primary: '#ee4d24',   // Brand orange
  dark: '#000000',      // Black
  darkOrange: '#c23d1a', // Darker orange
  mediumOrange: '#ff6f47', // Medium orange
};

const quickLinks = [
  {
    id: 'meals',
    title: 'Browse Meals',
    description: 'Explore our healthy meal options',
    icon: RestaurantIcon,
    href: '/meals',
    color: BRAND_COLORS.primary, // #ee4d24
  },
  {
    id: 'training',
    title: 'Training Packages',
    description: 'Get fit with our training programs',
    icon: FitnessCenterIcon,
    href: '/training',
    color: BRAND_COLORS.dark, // #000000
  },
  {
    id: 'books',
    title: 'Health Books',
    description: 'Learn about nutrition and wellness',
    icon: MenuBookIcon,
    href: '/books',
    color: BRAND_COLORS.darkOrange, // #c23d1a
  },
  {
    id: 'recipes',
    title: 'Recipes',
    description: 'Cook healthy meals at home',
    icon: ReceiptIcon,
    href: '/recipes',
    color: BRAND_COLORS.mediumOrange, // #ff6f47
  },
];

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const orderState = useAppSelector((state) => state.order);

  useEffect(() => {
    dispatch(fetchUserRequest());
    dispatch(fetchCartRequest());
    dispatch(fetchOrdersRequest());
  }, [dispatch]);

  // Get all menu items based on user's permissions
  // Users with multiple roles will see menu items for all their roles
  const menuItems = getAllMenuItemsForUser(auth.permissions);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {auth.user?.name || 'Guest'}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Your health and wellness journey starts here
        </Typography>

        <Grid container spacing={3}>
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={link.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          bgcolor: BRAND_COLORS.dark, // Black background
                          borderRadius: '50%',
                          p: 2,
                          display: 'flex',
                          width: 80,
                          height: 80,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon sx={{ fontSize: 40, color: BRAND_COLORS.primary }} /> {/* Orange icon */}
                      </Box>
                    </Box>
                    <Typography variant="h6" align="center" gutterBottom>
                      {link.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center">
                      {link.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      component={Link}
                      href={link.href}
                      sx={{
                        bgcolor: BRAND_COLORS.dark,
                        color: BRAND_COLORS.primary,
                        border: `2px solid ${BRAND_COLORS.dark}`,
                        '&:hover': {
                          bgcolor: BRAND_COLORS.primary,
                          color: BRAND_COLORS.dark,
                          borderColor: BRAND_COLORS.primary,
                        },
                      }}
                    >
                      Explore
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <ClientCouponsPanel />

        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="primary" /> Recent Orders
          </Typography>

          {orderState.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : orderState.orders.length > 0 ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {orderState.orders.slice(0, 3).map((order) => (
                <Grid size={{ xs: 12 }} key={order.id}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Order #{order.orderNumber}
                          </Typography>
                          <Typography variant="body2">
                            {new Date(order.createdAt).toLocaleDateString()} • ${order.total.toFixed(2)}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Chip
                            label={order.status.replace(/_/g, ' ')}
                            size="small"
                            color={
                              order.status === statusTypes.DELIVERED ? 'success' :
                                order.status === statusTypes.OUT_FOR_DELIVERY ? 'primary' :
                                  order.status === statusTypes.CANCELLED ? 'error' : 'warning'
                            }
                          />

                          {order.status === statusTypes.OUT_FOR_DELIVERY && (
                            <Button
                              variant="contained"
                              size="small"
                              component={Link}
                              href={`/tracking/${order.id}`}
                              startIcon={<LocalShippingIcon />}
                              sx={{
                                bgcolor: BRAND_COLORS.primary,
                                '&:hover': { bgcolor: BRAND_COLORS.darkOrange }
                              }}
                            >
                              Track Order
                            </Button>
                          )}

                          <Button
                            variant="outlined"
                            size="small"
                            component={Link}
                            href={`/client/orders`}
                            sx={{ color: 'text.secondary', borderColor: 'divider' }}
                          >
                            Details
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Card variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2, bgcolor: 'background.default' }}>
              <Typography variant="body1" color="text.secondary">
                You haven't placed any orders yet.
              </Typography>
              <Button
                component={Link}
                href="/meals"
                variant="text"
                sx={{ mt: 1, color: BRAND_COLORS.primary }}
              >
                Browse our delicious meals
              </Button>
            </Card>
          )}
        </Box>
      </Container>
    </>
  );
}
