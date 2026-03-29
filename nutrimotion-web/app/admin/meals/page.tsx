/**
 * Admin Meals Management Page
 * Organize by week (default) or by day. Weekly view lists days within each week (B/L/D per day).
 * Copy entire day or entire week duplicates meals to a target date / target week.
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Box,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import AddMealForm from '@/components/admin/AddMealForm';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import { MealSlot } from '@/types/catalog';
import axios from 'axios';

const SLOT_LABELS: Record<string, string> = {
  [MealSlot.BREAKFAST]: 'Breakfast',
  [MealSlot.LUNCH]: 'Lunch',
  [MealSlot.DINNER]: 'Dinner',
};

const SLOT_ORDER = [MealSlot.BREAKFAST, MealSlot.LUNCH, MealSlot.DINNER];

type OrganizationMode = 'week' | 'day';

interface MealDoc {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  slot: string;
  scheduledDate: string;
  available?: boolean;
  instagramLink?: string;
}

/**
 * Calendar day key YYYY-MM-DD using UTC date parts.
 * Meals store `scheduledDate` as UTC (e.g. midnight UTC for the chosen day); using local
 * getDate() here made headings show the previous day in US/Jamaica timezones.
 */
function getUtcCalendarKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Sunday 00:00 UTC of the week containing the given instant (week starts Sunday, UTC). */
function getWeekStartUtc(d: Date): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  const dow = d.getUTCDay();
  return new Date(Date.UTC(y, m, day - dow, 0, 0, 0, 0));
}

function formatWeekLabelFromUtcSundayKey(weekKey: string): string {
  const [y, mo, d] = weekKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatDayHeading(dayKey: string): string {
  const [y, mo, d] = dayKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Date line on each meal card — same calendar day as grouping (UTC). */
function formatMealDate(s: string): string {
  const d = new Date(s);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function buildSlotMap(): Map<string, MealDoc[]> {
  const m = new Map<string, MealDoc[]>();
  SLOT_ORDER.forEach((slot) => m.set(slot, []));
  return m;
}

export default function AdminMealsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealDoc | null>(null);
  const [meals, setMeals] = useState<MealDoc[]>([]);
  const [organization, setOrganization] = useState<OrganizationMode>('week');
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copySourceDayKey, setCopySourceDayKey] = useState<string | null>(null);
  const [copyTargetDate, setCopyTargetDate] = useState('');
  const [copyWeekDialogOpen, setCopyWeekDialogOpen] = useState(false);
  const [copySourceWeekKey, setCopySourceWeekKey] = useState<string | null>(null);
  const [copyWeekTargetDate, setCopyWeekTargetDate] = useState('');
  const [copying, setCopying] = useState(false);

  const showForm = showAddForm || !!editingMeal;

  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      const response = await axios.get<MealDoc[]>('/api/admin/meals');
      setMeals(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch meals:', error);
    }
  };

  const handleDeleteMeal = async (meal: MealDoc) => {
    if (!window.confirm(`Delete "${meal.name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/admin/meals/${meal._id}`);
      await fetchMeals();
    } catch (error) {
      console.error('Failed to delete meal:', error);
      window.alert('Failed to delete meal. Please try again.');
    }
  };

  /** weekKey (UTC Sunday) → dayKey → slot → meals */
  const mealsByWeek = useMemo(() => {
    const map = new Map<string, Map<string, Map<string, MealDoc[]>>>();
    for (const meal of meals) {
      const d = new Date(meal.scheduledDate);
      const weekStart = getWeekStartUtc(d);
      const weekKey = getUtcCalendarKey(weekStart);
      const dayKey = getUtcCalendarKey(d);
      if (!map.has(weekKey)) {
        map.set(weekKey, new Map());
      }
      const byDay = map.get(weekKey)!;
      if (!byDay.has(dayKey)) {
        byDay.set(dayKey, buildSlotMap());
      }
      const slot = meal.slot in SLOT_LABELS ? meal.slot : MealSlot.BREAKFAST;
      byDay.get(dayKey)!.get(slot)!.push(meal);
    }
    map.forEach((byDay) => {
      byDay.forEach((slotMap) => {
        slotMap.forEach((arr) =>
          arr.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
        );
      });
    });
    const weekKeys = Array.from(map.keys()).sort();
    return { weekKeys, map };
  }, [meals]);

  const mealsByDay = useMemo(() => {
    const map = new Map<string, Map<string, MealDoc[]>>();
    for (const meal of meals) {
      const d = new Date(meal.scheduledDate);
      const dayKey = getUtcCalendarKey(d);
      if (!map.has(dayKey)) {
        map.set(dayKey, buildSlotMap());
      }
      const slot = meal.slot in SLOT_LABELS ? meal.slot : MealSlot.BREAKFAST;
      map.get(dayKey)!.get(slot)!.push(meal);
    }
    map.forEach((slotMap) => {
      slotMap.forEach((arr) =>
        arr.sort((a, b) => a.name.localeCompare(b.name))
      );
    });
    const dayKeys = Array.from(map.keys()).sort();
    return { dayKeys, map };
  }, [meals]);

  const openCopyDayDialog = (dayKey: string) => {
    setCopySourceDayKey(dayKey);
    const [y, mo, d] = dayKey.split('-').map(Number);
    const next = new Date(Date.UTC(y, mo - 1, d + 1, 12, 0, 0));
    setCopyTargetDate(getUtcCalendarKey(next));
    setCopyDialogOpen(true);
  };

  const handleConfirmCopyDay = async () => {
    if (!copySourceDayKey || !copyTargetDate.trim()) return;
    const slotMap = mealsByDay.map.get(copySourceDayKey);
    if (!slotMap) return;
    const toCopy: MealDoc[] = [];
    SLOT_ORDER.forEach((slot) => {
      toCopy.push(...(slotMap.get(slot) || []));
    });
    if (toCopy.length === 0) {
      window.alert('No meals to copy on this day.');
      return;
    }
    if (copySourceDayKey === copyTargetDate.trim()) {
      window.alert('Choose a different date than the source day.');
      return;
    }
    setCopying(true);
    try {
      for (const meal of toCopy) {
        await axios.post('/api/admin/meals', {
          name: meal.name,
          description: meal.description?.trim() || 'Copied meal',
          imageUrl: meal.imageUrl?.trim() || undefined,
          price: meal.price,
          instagramLink: meal.instagramLink?.trim() || undefined,
          slot: meal.slot,
          scheduledDate: copyTargetDate.trim(),
        });
      }
      setCopyDialogOpen(false);
      setCopySourceDayKey(null);
      await fetchMeals();
    } catch (error) {
      console.error('Copy day failed:', error);
      window.alert('Failed to copy one or more meals. Please try again.');
    } finally {
      setCopying(false);
    }
  };

  /** Days from Sunday key to meal key (0–6). */
  function utcDaysFromWeekSunday(sundayKey: string, mealDayKey: string): number {
    const [y1, m1, d1] = sundayKey.split('-').map(Number);
    const [y2, m2, d2] = mealDayKey.split('-').map(Number);
    const t0 = Date.UTC(y1, m1 - 1, d1);
    const t1 = Date.UTC(y2, m2 - 1, d2);
    return Math.round((t1 - t0) / 86400000);
  }

  function addUtcDaysToCalendarKey(dayKey: string, deltaDays: number): string {
    const [y, m, d] = dayKey.split('-').map(Number);
    const t = Date.UTC(y, m - 1, d + deltaDays);
    return getUtcCalendarKey(new Date(t));
  }

  const openCopyWeekDialog = (weekKey: string) => {
    setCopySourceWeekKey(weekKey);
    const [y, mo, d] = weekKey.split('-').map(Number);
    const nextSunday = new Date(Date.UTC(y, mo - 1, d + 7, 12, 0, 0));
    setCopyWeekTargetDate(getUtcCalendarKey(nextSunday));
    setCopyWeekDialogOpen(true);
  };

  const handleConfirmCopyWeek = async () => {
    if (!copySourceWeekKey || !copyWeekTargetDate.trim()) return;
    const byDay = mealsByWeek.map.get(copySourceWeekKey);
    if (!byDay) return;
    const toCopy: MealDoc[] = [];
    byDay.forEach((slotMap) => {
      SLOT_ORDER.forEach((slot) => {
        toCopy.push(...(slotMap.get(slot) || []));
      });
    });
    if (toCopy.length === 0) {
      window.alert('No meals to copy in this week.');
      return;
    }
    const targetInput = new Date(`${copyWeekTargetDate.trim()}T12:00:00.000Z`);
    const targetWeekStartKey = getUtcCalendarKey(getWeekStartUtc(targetInput));
    if (targetWeekStartKey === copySourceWeekKey) {
      window.alert('Choose a date that falls in a different week than the source week.');
      return;
    }
    setCopying(true);
    try {
      for (const meal of toCopy) {
        const mealDayKey = getUtcCalendarKey(new Date(meal.scheduledDate));
        const offset = utcDaysFromWeekSunday(copySourceWeekKey, mealDayKey);
        const newDayKey = addUtcDaysToCalendarKey(targetWeekStartKey, offset);
        await axios.post('/api/admin/meals', {
          name: meal.name,
          description: meal.description?.trim() || 'Copied meal',
          imageUrl: meal.imageUrl?.trim() || undefined,
          price: meal.price,
          instagramLink: meal.instagramLink?.trim() || undefined,
          slot: meal.slot,
          scheduledDate: newDayKey,
        });
      }
      setCopyWeekDialogOpen(false);
      setCopySourceWeekKey(null);
      await fetchMeals();
    } catch (error) {
      console.error('Copy week failed:', error);
      window.alert('Failed to copy one or more meals. Please try again.');
    } finally {
      setCopying(false);
    }
  };

  function renderMealCard(meal: MealDoc) {
    return (
      <Card key={meal._id} variant="outlined" sx={{ overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
          <CardMedia
            component="img"
            height="120"
            sx={{ width: { xs: '100%', sm: 140 }, minWidth: 140 }}
            image={meal.imageUrl || '/placeholder-meal.jpg'}
            alt={meal.name}
          />
          <Box sx={{ flex: 1, p: 1.5 }}>
            <Typography variant="subtitle2">{meal.name}</Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {formatMealDate(meal.scheduledDate)}
            </Typography>
            <Typography variant="body2" color="primary">
              ${meal.price}
            </Typography>
            <CardActions sx={{ px: 0 }}>
              <IconButton
                size="small"
                aria-label="Edit meal"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingMeal(meal);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                aria-label="Delete meal"
                onClick={() => handleDeleteMeal(meal)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </CardActions>
          </Box>
        </Box>
      </Card>
    );
  }

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  const renderSlotColumns = (slotMap: Map<string, MealDoc[]>) => (
    <Grid container spacing={3}>
      {SLOT_ORDER.map((slot) => {
        const slotMeals = slotMap.get(slot) || [];
        return (
          <Grid size={{ xs: 12, md: 4 }} key={slot}>
            <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
              {SLOT_LABELS[slot]}
            </Typography>
            {slotMeals.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No meals
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {slotMeals.map((meal) => renderMealCard(meal))}
              </Box>
            )}
          </Grid>
        );
      })}
    </Grid>
  );

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
            mb: 3,
          }}
        >
          <Typography variant="h4">Meal Management</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
            <ToggleButtonGroup
              value={organization}
              exclusive
              onChange={(_, v) => v && setOrganization(v)}
              size="small"
              color="primary"
              aria-label="Organize meals by"
            >
              <ToggleButton value="week" aria-label="By week">
                <CalendarViewWeekIcon sx={{ mr: 0.5, fontSize: 18 }} />
                By week
              </ToggleButton>
              <ToggleButton value="day" aria-label="By day">
                <ViewDayIcon sx={{ mr: 0.5, fontSize: 18 }} />
                By day
              </ToggleButton>
            </ToggleButtonGroup>
            {!showForm && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingMeal(null);
                  setShowAddForm(true);
                }}
              >
                Add Meal
              </Button>
            )}
          </Box>
        </Box>

        {showForm ? (
          <AddMealForm
            initialMeal={editingMeal}
            onSuccess={() => {
              setShowAddForm(false);
              setEditingMeal(null);
              fetchMeals();
            }}
            onCancel={() => {
              setShowAddForm(false);
              setEditingMeal(null);
            }}
          />
        ) : meals.length === 0 ? (
          <Typography color="text.secondary">
            No meals yet. Click &quot;Add Meal&quot; to create one.
          </Typography>
        ) : organization === 'week' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {mealsByWeek.weekKeys.map((weekKey) => {
              const byDay = mealsByWeek.map.get(weekKey)!;
              const dayKeys = Array.from(byDay.keys()).sort();
              const weekTotal = dayKeys.reduce(
                (n, dk) =>
                  n +
                  SLOT_ORDER.reduce((m, slot) => m + (byDay.get(dk)!.get(slot)?.length ?? 0), 0),
                0
              );
              return (
                <Card key={weekKey} variant="outlined">
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'stretch', sm: 'flex-start' },
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6">Week of {formatWeekLabelFromUtcSundayKey(weekKey)}</Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ContentCopyIcon />}
                        disabled={weekTotal === 0}
                        onClick={() => openCopyWeekDialog(weekKey)}
                        sx={{ alignSelf: { sm: 'center' }, flexShrink: 0 }}
                      >
                        Copy entire week
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {dayKeys.map((dayKey) => {
                        const slotMap = byDay.get(dayKey)!;
                        const dayTotal = SLOT_ORDER.reduce((n, slot) => n + (slotMap.get(slot)?.length ?? 0), 0);
                        return (
                          <Box key={dayKey}>
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                justifyContent: 'space-between',
                                alignItems: { xs: 'stretch', sm: 'center' },
                                gap: 1,
                                mb: 1.5,
                              }}
                            >
                              <Typography variant="subtitle1" fontWeight={600}>
                                {formatDayHeading(dayKey)}
                              </Typography>
                              <Button
                                variant="text"
                                size="small"
                                startIcon={<ContentCopyIcon />}
                                disabled={dayTotal === 0}
                                onClick={() => openCopyDayDialog(dayKey)}
                                sx={{ flexShrink: 0 }}
                              >
                                Copy entire day
                              </Button>
                            </Box>
                            {renderSlotColumns(slotMap)}
                          </Box>
                        );
                      })}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {mealsByDay.dayKeys.map((dayKey) => {
              const slotMap = mealsByDay.map.get(dayKey)!;
              const totalMeals = SLOT_ORDER.reduce((n, slot) => n + (slotMap.get(slot)?.length ?? 0), 0);
              return (
                <Card key={dayKey} variant="outlined">
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'stretch', sm: 'flex-start' },
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6">{formatDayHeading(dayKey)}</Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ContentCopyIcon />}
                        disabled={totalMeals === 0}
                        onClick={() => openCopyDayDialog(dayKey)}
                        sx={{ alignSelf: { sm: 'center' }, flexShrink: 0 }}
                      >
                        Copy entire day
                      </Button>
                    </Box>
                    {renderSlotColumns(slotMap)}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Container>

      <Dialog open={copyDialogOpen} onClose={() => !copying && setCopyDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Copy entire day</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Duplicate every meal from{' '}
            <strong>{copySourceDayKey ? formatDayHeading(copySourceDayKey) : ''}</strong> (all meal types) onto
            the date below. New meals are added; originals stay unchanged.
          </Typography>
          <TextField
            label="Target date"
            type="date"
            fullWidth
            value={copyTargetDate}
            onChange={(e) => setCopyTargetDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={copying}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopyDialogOpen(false)} disabled={copying}>
            Cancel
          </Button>
          <Button onClick={handleConfirmCopyDay} variant="contained" disabled={copying || !copyTargetDate}>
            {copying ? 'Copying…' : 'Copy meals'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={copyWeekDialogOpen} onClose={() => !copying && setCopyWeekDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Copy entire week</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Duplicate every meal from the week starting{' '}
            <strong>{copySourceWeekKey ? formatWeekLabelFromUtcSundayKey(copySourceWeekKey) : ''}</strong> into
            the week that contains the date below (same weekdays and meal slots). New meals are added; originals
            stay unchanged.
          </Typography>
          <TextField
            label="Any date in target week"
            type="date"
            fullWidth
            value={copyWeekTargetDate}
            onChange={(e) => setCopyWeekTargetDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={copying}
            helperText="Weeks start on Sunday (UTC), matching your meal calendar."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopyWeekDialogOpen(false)} disabled={copying}>
            Cancel
          </Button>
          <Button onClick={handleConfirmCopyWeek} variant="contained" disabled={copying || !copyWeekTargetDate}>
            {copying ? 'Copying…' : 'Copy week'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
