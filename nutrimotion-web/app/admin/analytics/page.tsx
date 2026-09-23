/**
 * Admin Analytics Dashboard — live KPIs, trends, and operational insights.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import axios from 'axios';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { HorizontalBars, SimpleBarChart } from '@/components/admin/analytics/Charts';
import { formatMoney } from '@/lib/analytics/buildAnalytics';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchUserRequest } from '@/store/slices/authSlice';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';

type Days = 7 | 30 | 90;

interface KpiMetric {
  value: number;
  previous: number;
  changePercent: number | null;
  newInPeriod?: number;
}

interface DayPoint {
  date: string;
  value: number;
}

interface AnalyticsResponse {
  range: { days: number; start: string; end: string };
  kpis: {
    revenue: KpiMetric;
    orders: KpiMetric;
    users: KpiMetric & { newInPeriod: number };
    deliveries: KpiMetric;
  };
  trends: {
    revenue: DayPoint[];
    orders: DayPoint[];
    users: DayPoint[];
    revenueForecast: DayPoint[];
    orderForecast: DayPoint[];
  };
  orderStatus: { status: string; count: number }[];
  popularItems: {
    name: string;
    itemType: string;
    quantity: number;
    revenue: number;
  }[];
  topCustomers: {
    userId: string;
    name: string;
    email: string;
    orders: number;
    spend: number;
  }[];
  delivery: {
    total: number;
    completed: number;
    completionRate: number | null;
    avgMinutes: number | null;
    byStatus: { status: string; count: number }[];
  };
  customers: {
    unique: number;
    returning: number;
    retentionRate: number | null;
  };
  byParish: { parish: string; orders: number; revenue: number }[];
}

function ChangeChip({ change }: { change: number | null }) {
  if (change === null) {
    return <Chip size="small" label="n/a" variant="outlined" />;
  }
  const Icon =
    change > 0 ? TrendingUpIcon : change < 0 ? TrendingDownIcon : TrendingFlatIcon;
  const color = change > 0 ? 'success' : change < 0 ? 'error' : 'default';
  return (
    <Chip
      size="small"
      color={color}
      icon={<Icon />}
      label={`${change > 0 ? '+' : ''}${change}% vs prior`}
    />
  );
}

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

export default function AdminAnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [days, setDays] = useState<Days>(30);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchUserRequest());
  }, [dispatch]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<AnalyticsResponse>('/api/admin/analytics', {
        params: { days },
      });
      setData(res.data);
    } catch {
      setError('Failed to load analytics. Check that you have view:analytics permission.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  const kpiCards = useMemo(() => {
    if (!data) return [];
    return [
      {
        id: 'revenue',
        title: 'Revenue',
        value: formatMoney(data.kpis.revenue.value),
        change: data.kpis.revenue.changePercent,
        icon: TrendingUpIcon,
        color: '#4CAF50',
      },
      {
        id: 'orders',
        title: 'Orders',
        value: String(data.kpis.orders.value),
        change: data.kpis.orders.changePercent,
        icon: ShoppingCartIcon,
        color: '#2196F3',
      },
      {
        id: 'users',
        title: 'Total Users',
        value: String(data.kpis.users.value),
        subtitle: `+${data.kpis.users.newInPeriod} new`,
        change: data.kpis.users.changePercent,
        icon: PeopleIcon,
        color: '#9C27B0',
      },
      {
        id: 'deliveries',
        title: 'Completed Deliveries',
        value: String(data.kpis.deliveries.value),
        change: data.kpis.deliveries.changePercent,
        icon: LocalShippingIcon,
        color: '#FF6F00',
      },
    ];
  }, [data]);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AnalyticsIcon fontSize="large" color="primary" />
            <Box>
              <Typography variant="h4">Analytics Dashboard</Typography>
              {data && (
                <Typography variant="body2" color="text.secondary">
                  {data.range.start} → {data.range.end}
                </Typography>
              )}
            </Box>
          </Box>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={days}
            onChange={(_, v: Days | null) => {
              if (v) setDays(v);
            }}
          >
            <ToggleButton value={7}>7 days</ToggleButton>
            <ToggleButton value={30}>30 days</ToggleButton>
            <ToggleButton value={90}>90 days</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : data ? (
          <>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {kpiCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.id}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                          <Box
                            sx={{
                              bgcolor: card.color,
                              borderRadius: '8px',
                              p: 1,
                              display: 'flex',
                              mr: 2,
                            }}
                          >
                            <Icon sx={{ fontSize: 28, color: 'white' }} />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="h5" noWrap>
                              {card.value}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {card.title}
                            </Typography>
                            {'subtitle' in card && card.subtitle && (
                              <Typography variant="caption" color="text.secondary">
                                {card.subtitle}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <ChangeChip change={card.change} />
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Revenue trend
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Paid orders in period (dashed forecast = 7-day moving average)
                    </Typography>
                    <SimpleBarChart
                      data={data.trends.revenue.map((p) => ({
                        label: p.date,
                        value: p.value,
                        color: '#4CAF50',
                      }))}
                      valueFormatter={formatMoney}
                      height={220}
                    />
                    {data.trends.revenueForecast.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" gutterBottom>
                          7-day forecast
                        </Typography>
                        <SimpleBarChart
                          data={data.trends.revenueForecast.map((p) => ({
                            label: p.date,
                            value: p.value,
                            color: '#81C784',
                          }))}
                          valueFormatter={formatMoney}
                          height={120}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Order volume
                    </Typography>
                    <SimpleBarChart
                      data={data.trends.orders.map((p) => ({
                        label: p.date,
                        value: p.value,
                        color: '#2196F3',
                      }))}
                      height={180}
                    />
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      By status
                    </Typography>
                    <HorizontalBars
                      data={data.orderStatus.map((s) => ({
                        label: statusLabel(s.status),
                        value: s.count,
                        color: '#2196F3',
                      }))}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Customer behavior
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                      <Chip label={`${data.customers.unique} unique buyers`} />
                      <Chip
                        color="primary"
                        label={`${data.customers.returning} returning`}
                      />
                      <Chip
                        variant="outlined"
                        label={
                          data.customers.retentionRate != null
                            ? `${data.customers.retentionRate}% multi-order`
                            : 'No retention data'
                        }
                      />
                    </Box>
                    <Typography variant="subtitle2" gutterBottom>
                      User signups
                    </Typography>
                    <SimpleBarChart
                      data={data.trends.users.map((p) => ({
                        label: p.date,
                        value: p.value,
                        color: '#9C27B0',
                      }))}
                      height={140}
                    />
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Top customers by spend
                    </Typography>
                    {data.topCustomers.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No paid orders in this period
                      </Typography>
                    ) : (
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Customer</TableCell>
                            <TableCell align="right">Orders</TableCell>
                            <TableCell align="right">Spend</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.topCustomers.map((c) => (
                            <TableRow key={String(c.userId)}>
                              <TableCell>
                                <Typography variant="body2">{c.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {c.email}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">{c.orders}</TableCell>
                              <TableCell align="right">{formatMoney(c.spend)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Delivery performance
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                      <Chip label={`${data.delivery.total} assignments`} />
                      <Chip
                        color="success"
                        label={`${data.delivery.completed} delivered`}
                      />
                      <Chip
                        variant="outlined"
                        label={
                          data.delivery.completionRate != null
                            ? `${data.delivery.completionRate}% completion`
                            : 'No assignments'
                        }
                      />
                      <Chip
                        variant="outlined"
                        label={
                          data.delivery.avgMinutes != null
                            ? `~${data.delivery.avgMinutes} min avg`
                            : 'Avg time n/a'
                        }
                      />
                    </Box>
                    <HorizontalBars
                      data={data.delivery.byStatus.map((s) => ({
                        label: statusLabel(s.status),
                        value: s.count,
                        color: '#FF6F00',
                      }))}
                      emptyMessage="No delivery assignments in this period"
                    />
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Orders by parish
                    </Typography>
                    <HorizontalBars
                      data={data.byParish.map((p) => ({
                        label: p.parish,
                        value: p.orders,
                        color: '#FF6F00',
                      }))}
                      emptyMessage="No parish data yet"
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Popular meals & content
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Top items by quantity sold in paid orders
                </Typography>
                {data.popularItems.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No item sales in this period
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.popularItems.map((item) => (
                        <TableRow key={`${item.itemType}-${item.name}`}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <Chip size="small" label={item.itemType} variant="outlined" />
                          </TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{formatMoney(item.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </Container>
    </>
  );
}
