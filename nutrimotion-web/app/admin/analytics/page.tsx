/**
 * Admin Analytics Page
 */

'use client';

import { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
} from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';

const analyticsCards = [
  {
    id: 'revenue',
    title: 'Total Revenue',
    value: '$0',
    icon: TrendingUpIcon,
    color: '#4CAF50',
  },
  {
    id: 'orders',
    title: 'Total Orders',
    value: '0',
    icon: ShoppingCartIcon,
    color: '#2196F3',
  },
  {
    id: 'users',
    title: 'Total Users',
    value: '0',
    icon: PeopleIcon,
    color: '#9C27B0',
  },
  {
    id: 'deliveries',
    title: 'Completed Deliveries',
    value: '0',
    icon: LocalShippingIcon,
    color: '#FF6F00',
  },
];

export default function AdminAnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const auth = useAppSelector((state) => state.auth);

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <AnalyticsIcon fontSize="large" color="primary" />
          <Typography variant="h4">
            Analytics Dashboard
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {analyticsCards.map((card) => {
            const Icon = card.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          bgcolor: card.color,
                          borderRadius: '8px',
                          p: 1,
                          display: 'flex',
                          mr: 2,
                        }}
                      >
                        <Icon sx={{ fontSize: 32, color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h4">{card.value}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {card.title}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Analytics Features Coming Soon
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This section will include:
            </Typography>
            <Box component="ul" sx={{ mt: 2, pl: 3 }}>
              <li>Revenue trends and forecasting</li>
              <li>Order volume analysis</li>
              <li>Customer behavior insights</li>
              <li>Delivery performance metrics</li>
              <li>Popular meal and content analysis</li>
              <li>User growth and retention</li>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
