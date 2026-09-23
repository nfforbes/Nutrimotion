/**
 * Week timetable: slot rows × 7 day columns (Sunday-start UTC).
 */

'use client';

import { Box, Button, Card, CardContent, Chip, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MealCell from '@/components/admin/meals/MealCell';
import {
  formatDayShort,
  getMealsForCell,
  getTodayUtcKey,
  getWeekDayKeys,
  type MealCalendarDoc,
} from '@/lib/meals/calendar';
import { MEAL_SLOT_LABELS, MEAL_SLOT_ORDER } from '@/lib/meals/slots';
import { MealSlot } from '@/types/catalog';

export interface MealWeekTimetableProps {
  anchorDayKey: string;
  mealsByDay: Map<string, Map<string, MealCalendarDoc[]>>;
  onAdd: (dayKey: string, slot: MealSlot) => void;
  onEdit: (meal: MealCalendarDoc) => void;
  onDelete: (meal: MealCalendarDoc) => void;
  onCopyDay: (dayKey: string) => void;
  onCopyWeek: (weekSundayKey: string) => void;
}

export default function MealWeekTimetable({
  anchorDayKey,
  mealsByDay,
  onAdd,
  onEdit,
  onDelete,
  onCopyDay,
  onCopyWeek,
}: MealWeekTimetableProps) {
  const weekDays = getWeekDayKeys(anchorDayKey);
  const weekSundayKey = weekDays[0];
  const todayKey = getTodayUtcKey();

  const weekTotal = weekDays.reduce((total, dayKey) => {
    return (
      total +
      MEAL_SLOT_ORDER.reduce(
        (n, slot) => n + getMealsForCell(mealsByDay, dayKey, slot).length,
        0
      )
    );
  }, 0);

  return (
    <Card variant="outlined">
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            mb: 2,
          }}
        >
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentCopyIcon />}
            disabled={weekTotal === 0}
            onClick={() => onCopyWeek(weekSundayKey)}
          >
            Copy entire week
          </Button>
        </Box>

        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: 900 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '140px repeat(7, minmax(110px, 1fr))',
                gap: 1,
                mb: 1,
              }}
            >
              <Typography variant="subtitle2" sx={{ p: 1, fontWeight: 'bold' }}>
                Slot
              </Typography>
              {weekDays.map((dayKey) => {
                const dayTotal = MEAL_SLOT_ORDER.reduce(
                  (n, slot) => n + getMealsForCell(mealsByDay, dayKey, slot).length,
                  0
                );
                const isToday = dayKey === todayKey;
                return (
                  <Box
                    key={dayKey}
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor: isToday ? 'primary.light' : 'transparent',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight="bold">
                      {formatDayShort(dayKey)}
                    </Typography>
                    {isToday && (
                      <Typography variant="caption" display="block">
                        Today
                      </Typography>
                    )}
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<ContentCopyIcon />}
                      disabled={dayTotal === 0}
                      onClick={() => onCopyDay(dayKey)}
                      sx={{ mt: 0.5, fontSize: 11 }}
                    >
                      Copy day
                    </Button>
                  </Box>
                );
              })}
            </Box>

            {MEAL_SLOT_ORDER.map((slot) => (
              <Box
                key={slot}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '140px repeat(7, minmax(110px, 1fr))',
                  gap: 1,
                  mb: 1,
                  alignItems: 'stretch',
                }}
              >
                <Chip
                  label={MEAL_SLOT_LABELS[slot]}
                  color="primary"
                  sx={{ width: '100%', height: 'auto', py: 1.5 }}
                />
                {weekDays.map((dayKey) => (
                  <MealCell
                    key={`${slot}-${dayKey}`}
                    meals={getMealsForCell(mealsByDay, dayKey, slot)}
                    highlighted={dayKey === todayKey}
                    onAdd={() => onAdd(dayKey, slot)}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
