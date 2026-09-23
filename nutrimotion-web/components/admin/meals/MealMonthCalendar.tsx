/**
 * Month calendar grid with meal chips and + per day.
 */

'use client';

import { Box, Card, CardContent, Chip, IconButton, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
  formatDayShort,
  getMonthGridDayKeys,
  getTodayUtcKey,
  type MealCalendarDoc,
} from '@/lib/meals/calendar';
import { MEAL_SLOT_ORDER } from '@/lib/meals/slots';
import { MealSlot } from '@/types/catalog';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface MealMonthCalendarProps {
  anchorDayKey: string;
  mealsByDay: Map<string, Map<string, MealCalendarDoc[]>>;
  onSelectDay: (dayKey: string) => void;
  onAdd: (dayKey: string, slot?: MealSlot) => void;
  onEdit: (meal: MealCalendarDoc) => void;
}

export default function MealMonthCalendar({
  anchorDayKey,
  mealsByDay,
  onSelectDay,
  onAdd,
  onEdit,
}: MealMonthCalendarProps) {
  const days = getMonthGridDayKeys(anchorDayKey);
  const [anchorYear, anchorMonth] = anchorDayKey.split('-').map(Number);
  const todayKey = getTodayUtcKey();

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: 720 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                gap: 1,
                mb: 1,
              }}
            >
              {WEEKDAY_LABELS.map((label) => (
                <Typography
                  key={label}
                  variant="subtitle2"
                  align="center"
                  fontWeight="bold"
                  sx={{ p: 1 }}
                >
                  {label}
                </Typography>
              ))}
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                gap: 1,
              }}
            >
              {days.map((dayKey) => {
                const [y, mo] = dayKey.split('-').map(Number);
                const inMonth = y === anchorYear && mo === anchorMonth;
                const isToday = dayKey === todayKey;
                const slotMap = mealsByDay.get(dayKey);
                const dayMeals: MealCalendarDoc[] = [];
                if (slotMap) {
                  MEAL_SLOT_ORDER.forEach((slot) => {
                    dayMeals.push(...(slotMap.get(slot) || []));
                  });
                }

                return (
                  <Box
                    key={dayKey}
                    sx={{
                      border: '1px solid',
                      borderColor: isToday ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      minHeight: 120,
                      p: 1,
                      bgcolor: inMonth
                        ? isToday
                          ? 'action.selected'
                          : 'background.paper'
                        : 'action.hover',
                      opacity: inMonth ? 1 : 0.55,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography
                        component="button"
                        variant="subtitle2"
                        fontWeight={isToday ? 700 : 600}
                        onClick={() => onSelectDay(dayKey)}
                        sx={{
                          border: 0,
                          background: 'none',
                          cursor: 'pointer',
                          p: 0,
                          color: 'inherit',
                          textAlign: 'left',
                          '&:hover': { color: 'primary.main' },
                        }}
                      >
                        {formatDayShort(dayKey).split(' ').slice(1).join(' ')}
                      </Typography>
                      <IconButton
                        size="small"
                        aria-label={`Add meal on ${dayKey}`}
                        onClick={() => onAdd(dayKey, MealSlot.BREAKFAST)}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
                      {dayMeals.slice(0, 4).map((meal) => (
                        <Chip
                          key={meal._id}
                          size="small"
                          label={meal.name}
                          onClick={() => onEdit(meal)}
                          sx={{
                            maxWidth: '100%',
                            height: 22,
                            '& .MuiChip-label': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              px: 0.75,
                            },
                          }}
                        />
                      ))}
                      {dayMeals.length > 4 && (
                        <Typography variant="caption" color="text.secondary">
                          +{dayMeals.length - 4} more
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
