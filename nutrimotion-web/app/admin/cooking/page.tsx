'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
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
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';
import PrintIcon from '@mui/icons-material/Print';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** Weekday numbers (0 = Sunday) in the Monday–Sunday order of a meal week. */
const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0];

interface CookSlot {
  slot: string;
  label: string;
  total: number;
  items: { name: string; count: number }[];
}

interface CookPlan {
  cookDate: string;
  coversFrom: string;
  coversTo: string;
  totalMeals: number;
  orderCount: number;
  slots: CookSlot[];
  days: { date: string; total: number; slots: CookSlot[] }[];
}

interface CookingState {
  today: string;
  cookDays: number[];
  plans: CookPlan[];
}

function formatDay(key: string, withWeekday = true): string {
  return new Date(`${key}T12:00:00`).toLocaleDateString(undefined, {
    weekday: withWeekday ? 'short' : undefined,
    month: 'short',
    day: 'numeric',
  });
}

function errorText(e: unknown, fallback: string): string {
  return (axios.isAxiosError(e) && e.response?.data?.error) || fallback;
}

function PlanCard({ plan, isToday }: { plan: CookPlan; isToday: boolean }) {
  const range =
    plan.coversFrom === plan.coversTo
      ? formatDay(plan.coversFrom)
      : `${formatDay(plan.coversFrom)} – ${formatDay(plan.coversTo)}`;

  return (
    <Card variant="outlined" sx={{ height: '100%', breakInside: 'avoid' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6">Cook {formatDay(plan.cookDate)}</Typography>
          {isToday && <Chip size="small" color="primary" label="Today" />}
        </Box>
        <Typography variant="body2" color="text.secondary">
          For meals eaten {range} · {plan.totalMeals} meal{plan.totalMeals === 1 ? '' : 's'} from{' '}
          {plan.orderCount} order{plan.orderCount === 1 ? '' : 's'}
        </Typography>
        {plan.slots.length === 0 ? (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            No meals ordered for these days yet.
          </Typography>
        ) : (
          <Typography variant="overline" color="text.secondary" display="block" sx={{ mt: 2 }}>
            Total to cook
          </Typography>
        )}
        {plan.slots.map((slot) => (
          <Box key={slot.slot} sx={{ mt: 2 }}>
            <Divider sx={{ mb: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {slot.label}
              </Typography>
              <Typography variant="subtitle1" fontWeight={600}>
                {slot.total}
              </Typography>
            </Box>
            <Table size="small">
              <TableBody>
                {slot.items.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell sx={{ pl: 0 }}>{item.name}</TableCell>
                    <TableCell align="right" sx={{ pr: 0, fontWeight: 600, width: 64 }}>
                      × {item.count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        ))}

        {plan.totalMeals > 0 && (
          <>
            <Divider sx={{ mt: 2 }} />
            <Typography variant="overline" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Day by day
            </Typography>
            {plan.days.map((day) => (
              <DayBreakdown key={day.date} day={day} />
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DayBreakdown({ day }: { day: CookPlan['days'][number] }) {
  return (
    <Box sx={{ mt: 1.5, breakInside: 'avoid' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'grey.100', px: 1, py: 0.5, borderRadius: 1 }}>
        <Typography variant="subtitle2">{formatDay(day.date)}</Typography>
        <Typography variant="subtitle2">
          {day.total} meal{day.total === 1 ? '' : 's'}
        </Typography>
      </Box>
      {day.slots.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 1, pt: 0.5 }}>
          Nothing ordered.
        </Typography>
      ) : (
        day.slots.map((slot) => (
          <Box key={slot.slot} sx={{ px: 1, pt: 0.75 }}>
            <Typography variant="body2" fontWeight={600}>
              {slot.label} ({slot.total})
            </Typography>
            {slot.items.map((item) => (
              <Box key={item.name} sx={{ display: 'flex', justifyContent: 'space-between', pl: 1.5 }}>
                <Typography variant="body2">{item.name}</Typography>
                <Typography variant="body2" fontWeight={600}>
                  × {item.count}
                </Typography>
              </Box>
            ))}
          </Box>
        ))
      )}
    </Box>
  );
}

export default function AdminCookingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const auth = useAppSelector((state) => state.auth);
  const menuItems = getAllMenuItemsForUser(auth.permissions);
  const [state, setState] = useState<CookingState | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const apply = (data: CookingState) => {
    setState(data);
    setSelectedDays(data.cookDays);
  };

  const load = useCallback(() => {
    axios
      .get<CookingState>('/api/admin/cooking')
      .then(({ data }) => {
        apply(data);
        setError(null);
      })
      .catch((e) => setError(errorText(e, 'Could not load the cooking list.')));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = !!state && selectedDays.join(',') !== state.cookDays.join(',');

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const { data } = await axios.put<CookingState>('/api/admin/cooking', { cookDays: selectedDays });
      apply(data);
      setSaved(true);
    } catch (e) {
      setError(errorText(e, 'Could not save cook days.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <SoupKitchenIcon color="primary" />
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            Cooking list
          </Typography>
          {state && state.plans.length > 0 && (
            <Button startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ displayPrint: 'none' }}>
              Print
            </Button>
          )}
        </Box>

        <Card sx={{ mb: 3, displayPrint: 'none' }}>
          <CardContent>
            <Typography variant="h6">Cook days</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Each cook day covers meals eaten from that day up to the day before the next cook day.
            </Typography>
            <ToggleButtonGroup
              value={selectedDays}
              onChange={(_, days: number[]) => {
                setSelectedDays([...days].sort((a, b) => a - b));
                setSaved(false);
              }}
              color="primary"
              sx={{ flexWrap: 'wrap' }}
            >
              {MONDAY_FIRST.map((i) => (
                <ToggleButton key={i} value={i} sx={{ px: 2 }}>
                  {WEEKDAYS[i]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button variant="contained" onClick={save} disabled={!dirty || saving}>
                {saving ? 'Saving…' : 'Save cook days'}
              </Button>
              {saved && !dirty && <Typography color="success.main">Saved</Typography>}
            </Box>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!state ? (
          !error && <CircularProgress />
        ) : state.cookDays.length === 0 ? (
          <Alert severity="info">Choose your cook days above to see what to cook.</Alert>
        ) : (
          <Grid container spacing={3}>
            {state.plans.map((plan) => (
              <Grid key={plan.cookDate} size={{ xs: 12, md: 6 }}>
                <PlanCard plan={plan} isToday={plan.cookDate === state.today} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
}
