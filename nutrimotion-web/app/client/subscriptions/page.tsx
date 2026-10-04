/**
 * Client Subscriptions Page
 */

'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Box,
  Chip,
  Divider,
  CircularProgress,
  Button,
  Grid,
  Alert,
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

interface Plan {
  type: 'recipes' | 'videos';
  label: string;
  monthlyPrice: number;
  subscribed: boolean;
}

interface SubscriptionRow {
  id: string;
  type: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  price: number;
  billingInterval: 'monthly' | 'quarterly' | 'yearly';
}

const PLAN_BLURB: Record<Plan['type'], string> = {
  recipes: 'Every recipe in the library, with ingredients and step-by-step instructions.',
  videos: 'Every full cooking and training video.',
};

export default function ClientSubscriptionsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const auth = useAppSelector((state) => state.auth);

  const load = async () => {
    setLoading(true);
    try {
      const [plansRes, subsRes] = await Promise.all([
        axios.get<Plan[]>('/api/subscriptions/plans'),
        axios.get<SubscriptionRow[]>('/api/subscriptions'),
      ]);
      setPlans(plansRes.data);
      setSubscriptions(subsRes.data);
    } catch {
      setMessage({ ok: false, text: 'Could not load subscriptions. Sign in and refresh.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const subscribe = async (plan: Plan) => {
    setBusy(plan.type);
    try {
      await axios.post('/api/subscriptions', { type: plan.type });
      setMessage({ ok: true, text: `You're subscribed to ${plan.label}.` });
      await load();
    } catch (e) {
      const text = axios.isAxiosError(e) ? e.response?.data?.message || e.response?.data?.error : null;
      setMessage({ ok: false, text: text || 'Could not subscribe.' });
    } finally {
      setBusy(null);
    }
  };

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Subscriptions
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Subscribe to unlock the full recipe and video libraries.
        </Typography>

        {message && (
          <Alert severity={message.ok ? 'success' : 'error'} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 5 }}>
              {plans.map((plan) => (
                <Grid size={{ xs: 12, sm: 6 }} key={plan.type}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">{plan.label}</Typography>
                      <Typography variant="h5" color="primary" sx={{ my: 1 }}>
                        {plan.monthlyPrice > 0 ? `$${plan.monthlyPrice.toFixed(2)} / month` : 'Coming soon'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {PLAN_BLURB[plan.type]}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      {plan.subscribed ? (
                        <Chip icon={<CheckCircleIcon />} label="Subscribed" color="success" />
                      ) : (
                        <Button
                          fullWidth
                          variant="contained"
                          disabled={plan.monthlyPrice <= 0 || busy !== null}
                          onClick={() => subscribe(plan)}
                        >
                          {busy === plan.type ? 'Subscribing…' : `Subscribe to ${plan.label}`}
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Typography variant="h6" gutterBottom>
              My subscriptions
            </Typography>
            {subscriptions.length === 0 ? (
              <Typography color="text.secondary">You don&apos;t have any subscriptions yet.</Typography>
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
                            {format(new Date(subscription.startDate), 'PPP')} -{' '}
                            {format(new Date(subscription.endDate), 'PPP')}
                          </Typography>
                        </Box>
                        <Chip
                          label={subscription.status}
                          color={statusColors[subscription.status]}
                          icon={
                            subscription.status === SubscriptionStatus.ACTIVE ? <CheckCircleIcon /> : <CancelIcon />
                          }
                        />
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        Price: ${subscription.price.toFixed(2)}/
                        {subscription.billingInterval === 'monthly'
                          ? 'month'
                          : subscription.billingInterval === 'quarterly'
                            ? 'quarter'
                            : 'year'}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </>
        )}
      </Container>
    </>
  );
}
