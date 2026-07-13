/**
 * Admin Dashboard Page
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  CircularProgress,
  Chip,
  Divider,
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
import { MEAL_SLOT_LABELS, MEAL_SLOT_ORDER } from '@/lib/meals/slots';
import { MealSlot } from '@/types/catalog';
import axios from 'axios';

interface DashboardStats {
  mealsOrdered: number;
  activeOrders: number;
  inDelivery: number;
  totalUsers: number;
}

interface MealBreakdownEntry {
  name: string;
  count: number;
}

interface DashboardData {
  date: string;
  stats: DashboardStats;
  mealBreakdown: Record<MealSlot, MealBreakdownEntry[]>;
}

function todayInputValue(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayInputValue);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchUserRequest());
  }, [dispatch]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<DashboardData>('/api/admin/dashboard', {
        params: { date: selectedDate },
      });
      setData(res.data);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  const stats = data
    ? [
        {
          id: 'meals',
          title: 'Meals Ordered',
          subtitle: `for ${selectedDate}`,
          value: String(data.stats.mealsOrdered),
          icon: RestaurantIcon,
          color: '#4CAF50',
        },
        {
          id: 'orders',
          title: 'Active Orders',
          value: String(data.stats.activeOrders),
          icon: ShoppingBagIcon,
          color: '#2196F3',
        },
        {
          id: 'deliveries',
          title: 'In Delivery',
          value: String(data.stats.inDelivery),
          icon: LocalShippingIcon,
          color: '#FF6F00',
        },
        {
          id: 'users',
          title: 'Total Users',
          value: String(data.stats.totalUsers),
          icon: PeopleIcon,
          color: '#9C27B0',
        },
      ]
    : [];

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Live meal production view — counts reflect active orders (purchased, preparing, out for delivery)
        </Typography>

        <Box sx={{ mb: 4, maxWidth: 280 }}>
          <TextField
            fullWidth
            type="date"
            label="Production date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
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
                            {'subtitle' in stat && stat.subtitle && (
                              <Typography variant="caption" color="text.secondary">
                                {stat.subtitle}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="h5" gutterBottom>
              Meals to Prepare
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Breakdown by meal type from customer orders
            </Typography>

            <Grid container spacing={3}>
              {MEAL_SLOT_ORDER.map((slot) => {
                const items = data?.mealBreakdown[slot] ?? [];
                const slotTotal = items.reduce((sum, i) => sum + i.count, 0);

                return (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={slot}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6" color="primary">
                            {MEAL_SLOT_LABELS[slot]}
                          </Typography>
                          <Chip label={slotTotal} color={slotTotal > 0 ? 'primary' : 'default'} size="small" />
                        </Box>

                        {items.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No orders yet
                          </Typography>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {items.map((item) => (
                              <Box
                                key={item.name}
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  py: 0.5,
                                  borderBottom: '1px solid',
                                  borderColor: 'divider',
                                }}
                              >
                                <Typography variant="body2">{item.name}</Typography>
                                <Chip label={`×${item.count}`} size="small" variant="outlined" />
                              </Box>
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}
      </Container>
    </>
  );
}
