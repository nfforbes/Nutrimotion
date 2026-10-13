/**
 * Admin Meals Management — weekly planner. Meals run Monday to Sunday; drag a saved meal onto a
 * week's breakfast, lunch, smoothies or juice shots slot to serve it every day of that week.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Snackbar,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import MealPalette from '@/components/admin/meals/planner/MealPalette';
import MealCatalogDialog from '@/components/admin/meals/planner/MealCatalogDialog';
import WeekPlanBoard from '@/components/admin/meals/planner/WeekPlanBoard';
import MonthPlanBoard from '@/components/admin/meals/planner/MonthPlanBoard';
import { busyKey } from '@/components/admin/meals/planner/SlotDropZone';
import type {
  CatalogMeal,
  DragData,
  DropData,
  PlacedFlag,
  PlacedMeal,
  WeekPlan,
} from '@/components/admin/meals/planner/types';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import { MEAL_SLOT_LABELS } from '@/lib/meals/slots';
import {
  addDays,
  clientOrderingWeek,
  formatDayKey,
  isDayKey,
  jamaicaTodayKey,
  weekStartOf,
} from '@/lib/orders/orderWeek';
import type { MealSlot } from '@/types/catalog';

type PlannerView = 'week' | 'month';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function shiftMonth(dayKey: string, delta: number): string {
  const [y, m] = dayKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 10);
}

function monthWeekStarts(dayKey: string): string[] {
  const first = `${dayKey.slice(0, 7)}-01`;
  const last = addDays(shiftMonth(dayKey, 1), -1);
  const weeks: string[] = [];
  for (let w = weekStartOf(first); w <= last; w = addDays(w, 7)) weeks.push(w);
  return weeks;
}

function weekLabel(weekStart: string): string {
  return `${formatDayKey(weekStart)} – ${formatDayKey(addDays(weekStart, 6))}`;
}

/** Drop onto the slot under the pointer; keyboard drags have no pointer, so fall back to overlap. */
const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : rectIntersection(args);
};

function errorMessage(error: unknown, fallback: string): string {
  return axios.isAxiosError(error) && error.response?.data?.error ? String(error.response.data.error) : fallback;
}

function updatePlan(
  plans: WeekPlan[],
  weekStart: string,
  slot: MealSlot,
  change: (meals: PlacedMeal[]) => PlacedMeal[]
): WeekPlan[] {
  return plans.map((plan) =>
    plan.weekStart === weekStart ? { ...plan, slots: { ...plan.slots, [slot]: change(plan.slots[slot]) } } : plan
  );
}

export default function AdminMealsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<PlannerView>('week');
  const [anchor, setAnchor] = useState(() => jamaicaTodayKey());
  const [catalog, setCatalog] = useState<CatalogMeal[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [plans, setPlans] = useState<WeekPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyKeys, setBusyKeys] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
  const [mealDialog, setMealDialog] = useState<{ open: boolean; meal: CatalogMeal | null }>({ open: false, meal: null });
  const [copySource, setCopySource] = useState<string | null>(null);
  const [copyTarget, setCopyTarget] = useState('');
  const [copying, setCopying] = useState(false);
  const loadSeq = useRef(0);

  const auth = useAppSelector((state) => state.auth);
  const menuItems = getAllMenuItemsForUser(auth.permissions);

  const todayWeek = weekStartOf(jamaicaTodayKey());
  const orderingWeek = useMemo(() => clientOrderingWeek().weekStart, []);
  const weekStart = weekStartOf(anchor);
  const weekStarts = useMemo(() => (view === 'week' ? [weekStart] : monthWeekStarts(anchor)), [view, weekStart, anchor]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const loadCatalog = useCallback(async () => {
    try {
      const res = await axios.get<CatalogMeal[]>('/api/admin/meals/catalog');
      setCatalog(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setLoadError(errorMessage(error, 'Could not load meals. Sign in as an admin and refresh.'));
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const loadPlans = useCallback(
    async (silent = false) => {
      const seq = ++loadSeq.current;
      if (!silent) setPlansLoading(true);
      try {
        const res = await axios.get<WeekPlan[]>('/api/admin/meals/weeks', {
          params: { from: weekStarts[0], to: weekStarts[weekStarts.length - 1] },
        });
        if (seq !== loadSeq.current) return;
        setPlans(Array.isArray(res.data) ? res.data : []);
        setLoadError(null);
      } catch (error) {
        if (seq !== loadSeq.current) return;
        setLoadError(errorMessage(error, 'Could not load the meal plan. Sign in as an admin and refresh.'));
      } finally {
        if (seq === loadSeq.current) setPlansLoading(false);
      }
    },
    [weekStarts]
  );

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const setBusy = (key: string, on: boolean) =>
    setBusyKeys((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  /** Applies an optimistic change, runs the request, then reloads the visible weeks. */
  const runChange = async (
    key: string,
    optimistic: (plans: WeekPlan[]) => WeekPlan[],
    request: () => Promise<unknown>,
    failure: string
  ) => {
    setPlans(optimistic);
    setBusy(key, true);
    try {
      await request();
    } catch (error) {
      setToast({ message: errorMessage(error, failure), error: true });
    } finally {
      setBusy(key, false);
      loadPlans(true);
    }
  };

  const placeMeal = (target: DropData, meal: PlacedMeal, from: DropData | null) => {
    const existing = plans.find((p) => p.weekStart === target.weekStart)?.slots[target.slot].find((m) => m.name === meal.name);
    if (!from && existing?.days === 7) {
      setToast({ message: `${meal.name} is already in ${MEAL_SLOT_LABELS[target.slot]} that week.` });
      return;
    }
    const placed: PlacedMeal = existing
      ? { ...existing, days: 7 }
      : { ...meal, days: 7 };
    runChange(
      busyKey(target.weekStart, target.slot, meal.name),
      (prev) => {
        let next = prev;
        if (from) next = updatePlan(next, from.weekStart, from.slot, (meals) => meals.filter((m) => m.name !== meal.name));
        return updatePlan(next, target.weekStart, target.slot, (meals) =>
          [...meals.filter((m) => m.name !== meal.name), placed].sort((a, b) => a.name.localeCompare(b.name))
        );
      },
      () => axios.post('/api/admin/meals/weeks/place', { ...target, name: meal.name, from }),
      `Could not place ${meal.name}.`
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDrag((event.active.data.current as DragData | undefined) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);
    const drag = event.active.data.current as DragData | undefined;
    const drop = event.over?.data.current as DropData | undefined;
    if (!drag || !drop) return;
    if (drag.kind === 'catalog') {
      const { meal } = drag;
      placeMeal(
        drop,
        { name: meal.name, price: meal.price, imageUrl: meal.imageUrl, available: true, soldIndividually: meal.soldIndividually, days: 7 },
        null
      );
    } else if (drag.weekStart !== drop.weekStart || drag.slot !== drop.slot) {
      placeMeal(drop, drag.meal, { weekStart: drag.weekStart, slot: drag.slot });
    }
  };

  const toggleFlag = (week: string, slot: MealSlot, meal: PlacedMeal, flag: PlacedFlag) => {
    const value = !meal[flag];
    runChange(
      busyKey(week, slot, meal.name),
      (prev) => updatePlan(prev, week, slot, (meals) => meals.map((m) => (m.name === meal.name ? { ...m, [flag]: value } : m))),
      () => axios.patch('/api/admin/meals/weeks/place', { weekStart: week, slot, name: meal.name, [flag]: value }),
      `Could not update ${meal.name}.`
    );
  };

  const fillMeal = (week: string, slot: MealSlot, meal: PlacedMeal) => placeMeal({ weekStart: week, slot }, meal, null);

  const removeMeal = (week: string, slot: MealSlot, meal: PlacedMeal) => {
    if (!window.confirm(`Remove ${meal.name} from ${MEAL_SLOT_LABELS[slot]} for ${weekLabel(week)}?`)) return;
    runChange(
      busyKey(week, slot, meal.name),
      (prev) => updatePlan(prev, week, slot, (meals) => meals.filter((m) => m.name !== meal.name)),
      () => axios.delete('/api/admin/meals/weeks/place', { data: { weekStart: week, slot, name: meal.name } }),
      `Could not remove ${meal.name}.`
    );
  };

  const openCopy = (source: string) => {
    setCopySource(source);
    setCopyTarget(addDays(source, 7));
  };

  const confirmCopy = async () => {
    if (!copySource || !isDayKey(copyTarget)) return;
    const target = weekStartOf(copyTarget);
    setCopying(true);
    try {
      const res = await axios.post<{ meals: number; added: number }>('/api/admin/meals/weeks/copy', {
        from: copySource,
        to: target,
      });
      setToast({
        message: `Copied ${res.data.meals} meal${res.data.meals === 1 ? '' : 's'} into ${weekLabel(target)}${
          res.data.added === 0 ? ' (they were already there)' : ''
        }.`,
      });
      setCopySource(null);
      loadPlans(true);
    } catch (error) {
      setToast({ message: errorMessage(error, 'Could not copy the week.'), error: true });
    } finally {
      setCopying(false);
    }
  };

  const handleMealChanged = (meal: CatalogMeal | null) => {
    loadCatalog();
    if (meal) loadPlans(true);
  };

  const weekPlan = plans.find((p) => p.weekStart === weekStart);
  const title =
    view === 'week' ? `Week of ${weekLabel(weekStart)}` : `${MONTHS[Number(anchor.slice(5, 7)) - 1]} ${anchor.slice(0, 4)}`;
  const shift = (direction: -1 | 1) =>
    setAnchor((prev) => (view === 'week' ? addDays(prev, direction * 7) : shiftMonth(prev, direction)));
  const chipActions = { onToggle: toggleFlag, onFill: fillMeal, onRemove: removeMeal };
  const copyTargetWeek = isDayKey(copyTarget) ? weekStartOf(copyTarget) : null;

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', md: 'center' },
            gap: 2,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CalendarTodayIcon color="primary" />
            <Box>
              <Typography variant="h4">Meal Management</Typography>
              <Typography variant="body2" color="text.secondary">
                {title}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={(_, v: PlannerView | null) => v && setView(v)}
              size="small"
              color="primary"
              aria-label="Planner view"
            >
              <ToggleButton value="week">
                <CalendarViewWeekIcon sx={{ mr: 0.5, fontSize: 18 }} />
                Week
              </ToggleButton>
              <ToggleButton value="month">
                <CalendarMonthIcon sx={{ mr: 0.5, fontSize: 18 }} />
                Month
              </ToggleButton>
            </ToggleButtonGroup>
            <Button variant="outlined" size="small" onClick={() => shift(-1)} startIcon={<ChevronLeftIcon />}>
              Prev
            </Button>
            <Button variant="outlined" size="small" onClick={() => setAnchor(jamaicaTodayKey())}>
              Today
            </Button>
            <Button variant="outlined" size="small" onClick={() => shift(1)} endIcon={<ChevronRightIcon />}>
              Next
            </Button>
            {view === 'week' && (
              <Button variant="contained" size="small" startIcon={<ContentCopyIcon />} onClick={() => openCopy(weekStart)}>
                Copy week
              </Button>
            )}
          </Box>
        </Box>

        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {loadError}
          </Alert>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveDrag(null)}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px minmax(0, 1fr)' }, gap: 2, alignItems: 'start' }}>
            <MealPalette
              meals={catalog}
              loading={catalogLoading}
              onAdd={() => setMealDialog({ open: true, meal: null })}
              onEdit={(meal) => setMealDialog({ open: true, meal })}
            />
            <Box>
              {view === 'week' && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5, alignItems: 'center' }}>
                  {weekStart === todayWeek && <Chip size="small" color="primary" label="This week" />}
                  {weekStart === orderingWeek && <Chip size="small" color="success" label="Clients are ordering for this week" />}
                  {weekStart < todayWeek && <Chip size="small" label="This week has passed" />}
                  {plansLoading && (
                    <Typography variant="caption" color="text.secondary">
                      Loading…
                    </Typography>
                  )}
                </Box>
              )}
              {view === 'month' && plansLoading && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Loading…
                </Typography>
              )}
              {view === 'week' && weekPlan && <WeekPlanBoard plan={weekPlan} busyKeys={busyKeys} {...chipActions} />}
              {view === 'month' && plans.length > 0 && (
                <MonthPlanBoard
                  plans={plans}
                  busyKeys={busyKeys}
                  currentWeekStart={todayWeek}
                  orderingWeekStart={orderingWeek}
                  onOpenWeek={(w) => {
                    setAnchor(w);
                    setView('week');
                  }}
                  onCopyWeek={openCopy}
                  {...chipActions}
                />
              )}
            </Box>
          </Box>
          <DragOverlay dropAnimation={null}>
            {activeDrag && (
              <Paper elevation={6} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, pr: 2, borderRadius: 2, cursor: 'grabbing', maxWidth: 280 }}>
                <Avatar variant="rounded" src={activeDrag.meal.imageUrl} sx={{ width: 32, height: 32, bgcolor: 'grey.200', color: 'grey.500' }}>
                  <RestaurantIcon fontSize="small" />
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {activeDrag.meal.name}
                </Typography>
              </Paper>
            )}
          </DragOverlay>
        </DndContext>
      </Container>

      <MealCatalogDialog
        open={mealDialog.open}
        meal={mealDialog.meal}
        onClose={() => setMealDialog((prev) => ({ ...prev, open: false }))}
        onChanged={handleMealChanged}
      />

      <Dialog open={copySource !== null} onClose={() => !copying && setCopySource(null)} fullWidth maxWidth="xs">
        <DialogTitle>Copy week</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Every meal from <strong>{copySource ? weekLabel(copySource) : ''}</strong> will be served all week in the week
            you choose. Meals already in that week stay.
          </Typography>
          <TextField
            label="Any day in the target week"
            type="date"
            fullWidth
            value={copyTarget}
            onChange={(e) => setCopyTarget(e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={copying}
            helperText={copyTargetWeek ? `Copies into ${weekLabel(copyTargetWeek)}` : ' '}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopySource(null)} disabled={copying}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmCopy}
            disabled={copying || !copyTargetWeek || copyTargetWeek === copySource}
          >
            {copying ? 'Copying…' : 'Copy week'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast !== null}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert severity={toast.error ? 'error' : 'success'} onClose={() => setToast(null)} variant="filled">
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}
