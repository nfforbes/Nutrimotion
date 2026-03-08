/**
 * Admin Dashboard Page
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchUserRequest } from '@/store/slices/authSlice';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';

const stats = [
  {
    id: 'meals',
    title: 'Total Meals',
    value: '0',
    icon: RestaurantIcon,
    color: '#4CAF50',
  },
  {
    id: 'orders',
    title: 'Active Orders',
    value: '0',
    icon: ShoppingBagIcon,
    color: '#2196F3',
  },
  {
    id: 'deliveries',
    title: 'In Delivery',
    value: '0',
    icon: LocalShippingIcon,
    color: '#FF6F00',
  },
  {
    id: 'users',
    title: 'Total Users',
    value: '0',
    icon: PeopleIcon,
    color: '#9C27B0',
  },
];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchUserRequest());
  }, [dispatch]);

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Manage your meal delivery service
        </Typography>

        <Grid container spacing={3}>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          bgcolor: stat.color,
                          borderRadius: '8px',
                          p: 1,
                          display: 'flex',
                          mr: 2,
                        }}
                      >
                        <Icon sx={{ fontSize: 32, color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h4">{stat.value}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stat.title}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </>
  );
}
