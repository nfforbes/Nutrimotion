/**
 * Day timetable: four slot rows for a single calendar day.
 */

'use client';

import { Box, Card, CardContent, Chip, Typography } from '@mui/material';
import MealCell from '@/components/admin/meals/MealCell';
import {
  formatDayHeading,
  getMealsForCell,
  getTodayUtcKey,
  type MealCalendarDoc,
} from '@/lib/meals/calendar';
import { MEAL_SLOT_LABELS, MEAL_SLOT_ORDER } from '@/lib/meals/slots';
import { MealSlot } from '@/types/catalog';

export interface MealDayTimetableProps {
  dayKey: string;
  mealsByDay: Map<string, Map<string, MealCalendarDoc[]>>;
  onAdd: (dayKey: string, slot: MealSlot) => void;
  onEdit: (meal: MealCalendarDoc) => void;
  onDelete: (meal: MealCalendarDoc) => void;
}

export default function MealDayTimetable({
  dayKey,
  mealsByDay,
  onAdd,
  onEdit,
  onDelete,
}: MealDayTimetableProps) {
  const isToday = dayKey === getTodayUtcKey();

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {formatDayHeading(dayKey)}
          {isToday ? ' · Today' : ''}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {MEAL_SLOT_ORDER.map((slot) => (
            <Box
              key={slot}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '140px 1fr' },
                gap: 1.5,
                alignItems: 'stretch',
              }}
            >
              <Chip
                label={MEAL_SLOT_LABELS[slot]}
                color="primary"
                sx={{ width: '100%', justifyContent: 'flex-start' }}
              />
              <MealCell
                meals={getMealsForCell(mealsByDay, dayKey, slot)}
                highlighted={isToday}
                minHeight={120}
                onAdd={() => onAdd(dayKey, slot)}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
