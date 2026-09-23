/**
 * Admin Meals Management — calendar-first day / week / month timetable.
 * Defaults to today (week view). Add meals via + on each cell.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import AddMealForm from '@/components/admin/AddMealForm';
import MealCalendarToolbar from '@/components/admin/meals/MealCalendarToolbar';
import MealDayTimetable from '@/components/admin/meals/MealDayTimetable';
import MealWeekTimetable from '@/components/admin/meals/MealWeekTimetable';
import MealMonthCalendar from '@/components/admin/meals/MealMonthCalendar';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import { MEAL_SLOT_ORDER } from '@/lib/meals/slots';
import {
  addUtcDays,
  formatDayHeading,
  formatMonthLabel,
  formatWeekLabel,
  getTodayUtcKey,
  getUtcCalendarKey,
  getVisibleRange,
  getWeekDayKeys,
  getWeekStartUtc,
  groupMealsByDayAndSlot,
  parseUtcDayKey,
  shiftAnchor,
  utcDaysBetween,
  type CalendarView,
  type MealCalendarDoc,
} from '@/lib/meals/calendar';
import { MealSlot } from '@/types/catalog';
import axios from 'axios';

interface FormContext {
  dayKey: string;
  slot: MealSlot;
  editingMeal: MealCalendarDoc | null;
}

export default function AdminMealsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<CalendarView>('week');
  const [anchorDayKey, setAnchorDayKey] = useState(getTodayUtcKey);
  const [meals, setMeals] = useState<MealCalendarDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formContext, setFormContext] = useState<FormContext | null>(null);

  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copySourceDayKey, setCopySourceDayKey] = useState<string | null>(null);
  const [copyTargetDate, setCopyTargetDate] = useState('');
  const [copyWeekDialogOpen, setCopyWeekDialogOpen] = useState(false);
  const [copySourceWeekKey, setCopySourceWeekKey] = useState<string | null>(null);
  const [copyWeekTargetDate, setCopyWeekTargetDate] = useState('');
  const [copying, setCopying] = useState(false);

  const auth = useAppSelector((state) => state.auth);
  const menuItems = getAllMenuItemsForUser(auth.permissions);

  const range = useMemo(
    () => getVisibleRange(anchorDayKey, view),
    [anchorDayKey, view]
  );

  const mealsByDay = useMemo(() => groupMealsByDayAndSlot(meals), [meals]);

  const toolbarTitle = useMemo(() => {
    if (view === 'day') return formatDayHeading(anchorDayKey);
    if (view === 'week') {
      const sunday = getWeekDayKeys(anchorDayKey)[0];
      return `Week of ${formatWeekLabel(sunday)}`;
    }
    return formatMonthLabel(anchorDayKey);
  }, [anchorDayKey, view]);

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get<MealCalendarDoc[]>('/api/admin/meals/schedule', {
        params: {
          startDate: range.startDate,
          endDate: range.endDate,
        },
      });
      setMeals(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch meal schedule:', error);
      setMeals([]);
    } finally {
      setLoading(false);
    }
  }, [range.endDate, range.startDate]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const openAddForm = (dayKey: string, slot: MealSlot = MealSlot.BREAKFAST) => {
    setFormContext({ dayKey, slot, editingMeal: null });
    setFormOpen(true);
  };

  const openEditForm = (meal: MealCalendarDoc) => {
    const dayKey = getUtcCalendarKey(new Date(meal.scheduledDate));
    setFormContext({
      dayKey,
      slot: (meal.slot as MealSlot) || MealSlot.BREAKFAST,
      editingMeal: meal,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormContext(null);
  };

  const handleDeleteMeal = async (meal: MealCalendarDoc) => {
    if (!window.confirm(`Delete "${meal.name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/admin/meals/${meal._id}`);
      await fetchMeals();
    } catch (error) {
      console.error('Failed to delete meal:', error);
      window.alert('Failed to delete meal. Please try again.');
    }
  };

  const openCopyDayDialog = (dayKey: string) => {
    setCopySourceDayKey(dayKey);
    setCopyTargetDate(addUtcDays(dayKey, 1));
    setCopyDialogOpen(true);
  };

  const handleConfirmCopyDay = async () => {
    if (!copySourceDayKey || !copyTargetDate.trim()) return;
    const slotMap = mealsByDay.get(copySourceDayKey);
    if (!slotMap) return;
    const toCopy: MealCalendarDoc[] = [];
    MEAL_SLOT_ORDER.forEach((slot) => {
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

  const openCopyWeekDialog = (weekKey: string) => {
    setCopySourceWeekKey(weekKey);
    setCopyWeekTargetDate(addUtcDays(weekKey, 7));
    setCopyWeekDialogOpen(true);
  };

  const handleConfirmCopyWeek = async () => {
    if (!copySourceWeekKey || !copyWeekTargetDate.trim()) return;
    const weekDays = getWeekDayKeys(copySourceWeekKey);
    const toCopy: MealCalendarDoc[] = [];
    weekDays.forEach((dayKey) => {
      const slotMap = mealsByDay.get(dayKey);
      if (!slotMap) return;
      MEAL_SLOT_ORDER.forEach((slot) => {
        toCopy.push(...(slotMap.get(slot) || []));
      });
    });
    if (toCopy.length === 0) {
      window.alert('No meals to copy in this week.');
      return;
    }
    const targetInput = parseUtcDayKey(copyWeekTargetDate.trim());
    const targetWeekStartKey = getUtcCalendarKey(getWeekStartUtc(targetInput));
    if (targetWeekStartKey === copySourceWeekKey) {
      window.alert('Choose a date that falls in a different week than the source week.');
      return;
    }
    setCopying(true);
    try {
      for (const meal of toCopy) {
        const mealDayKey = getUtcCalendarKey(new Date(meal.scheduledDate));
        const offset = utcDaysBetween(copySourceWeekKey, mealDayKey);
        const newDayKey = addUtcDays(targetWeekStartKey, offset);
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

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <MealCalendarToolbar
          title={toolbarTitle}
          view={view}
          onViewChange={setView}
          onToday={() => setAnchorDayKey(getTodayUtcKey())}
          onPrev={() => setAnchorDayKey((prev) => shiftAnchor(prev, view, -1))}
          onNext={() => setAnchorDayKey((prev) => shiftAnchor(prev, view, 1))}
        />

        {loading && (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Loading meals…
          </Typography>
        )}

        {view === 'day' && (
          <MealDayTimetable
            dayKey={anchorDayKey}
            mealsByDay={mealsByDay}
            onAdd={openAddForm}
            onEdit={openEditForm}
            onDelete={handleDeleteMeal}
          />
        )}

        {view === 'week' && (
          <MealWeekTimetable
            anchorDayKey={anchorDayKey}
            mealsByDay={mealsByDay}
            onAdd={openAddForm}
            onEdit={openEditForm}
            onDelete={handleDeleteMeal}
            onCopyDay={openCopyDayDialog}
            onCopyWeek={openCopyWeekDialog}
          />
        )}

        {view === 'month' && (
          <MealMonthCalendar
            anchorDayKey={anchorDayKey}
            mealsByDay={mealsByDay}
            onSelectDay={(dayKey) => {
              setAnchorDayKey(dayKey);
              setView('day');
            }}
            onAdd={openAddForm}
            onEdit={openEditForm}
          />
        )}
      </Container>

      <Dialog open={formOpen} onClose={closeForm} maxWidth="md" fullWidth>
        <DialogTitle>
          {formContext?.editingMeal
            ? `Edit Meal — ${formatDayHeading(formContext.dayKey)}`
            : `Add Meal — ${formContext ? formatDayHeading(formContext.dayKey) : ''}`}
        </DialogTitle>
        <DialogContent>
          {formContext && (
            <Box sx={{ mt: 1 }}>
              <AddMealForm
                hideBackButton
                defaultDate={formContext.dayKey}
                defaultSlot={formContext.slot}
                initialMeal={formContext.editingMeal}
                onSuccess={() => {
                  closeForm();
                  fetchMeals();
                }}
                onCancel={closeForm}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={copyDialogOpen} onClose={() => !copying && setCopyDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Copy entire day</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Duplicate every meal from{' '}
            <strong>{copySourceDayKey ? formatDayHeading(copySourceDayKey) : ''}</strong> onto the date
            below. New meals are added; originals stay unchanged.
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

      <Dialog
        open={copyWeekDialogOpen}
        onClose={() => !copying && setCopyWeekDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Copy entire week</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Duplicate every meal from the week starting{' '}
            <strong>{copySourceWeekKey ? formatWeekLabel(copySourceWeekKey) : ''}</strong> into the week
            that contains the date below. New meals are added; originals stay unchanged.
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
          <Button
            onClick={handleConfirmCopyWeek}
            variant="contained"
            disabled={copying || !copyWeekTargetDate}
          >
            {copying ? 'Copying…' : 'Copy week'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
