/**
 * Client Subscriptions Page
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Button,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import { SubscriptionStatus } from '@/types/commerce';
import { format } from 'date-fns';

const statusColors: Record<SubscriptionStatus, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  [SubscriptionStatus.ACTIVE]: 'success',
  [SubscriptionStatus.INACTIVE]: 'default',
  [SubscriptionStatus.CANCELLED]: 'error',
  [SubscriptionStatus.EXPIRED]: 'warning',
};

export default function ClientSubscriptionsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = useAppSelector((state) => state.auth);
  
  useEffect(() => {
    // TODO: Fetch subscriptions from API
    // For now, show empty state
    setLoading(false);
  }, []);
  
  const menuItems = getAllMenuItemsForUser(auth.permissions);
  
  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Subscriptions
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Manage your active subscriptions for recipes, videos, and training content
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : subscriptions.length === 0 ? (
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" gutterBottom>
                  No Active Subscriptions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  You don't have any active subscriptions yet. Subscribe to access exclusive content!
                </Typography>
                <Button variant="contained" onClick={() => window.location.href = '/dashboard'}>
                  Browse Content
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {subscriptions.map((subscription) => (
              <Card key={subscription.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                        {subscription.type} Subscription
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(subscription.startDate), 'PPP')} - {format(new Date(subscription.endDate), 'PPP')}
                      </Typography>
                    </Box>
                    <Chip
                      label={subscription.status}
                      color={statusColors[subscription.status as SubscriptionStatus]}
                      icon={
                        subscription.status === SubscriptionStatus.ACTIVE ? (
                          <CheckCircleIcon />
                        ) : (
                          <CancelIcon />
                        )
                      }
                    />
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Billing: {subscription.billingInterval}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Price: ${subscription.price.toFixed(2)}/{subscription.billingInterval === 'monthly' ? 'month' : subscription.billingInterval === 'quarterly' ? 'quarter' : 'year'}
                      </Typography>
                    </Box>
                    {subscription.status === SubscriptionStatus.ACTIVE && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => {
                          // TODO: Handle cancellation
                          console.log('Cancel subscription:', subscription.id);
                        }}
                      >
                        Cancel Subscription
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>
    </>
  );
}
