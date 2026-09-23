/**
 * Toolbar for meal calendar: title, Today, Prev/Next, Day/Week/Month toggle.
 */

'use client';

import { Box, Button, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import type { CalendarView } from '@/lib/meals/calendar';

export interface MealCalendarToolbarProps {
  title: string;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function MealCalendarToolbar({
  title,
  view,
  onViewChange,
  onToday,
  onPrev,
  onNext,
}: MealCalendarToolbarProps) {
  return (
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

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          alignItems: 'center',
          justifyContent: { xs: 'flex-start', md: 'flex-end' },
        }}
      >
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, v) => v && onViewChange(v)}
          size="small"
          color="primary"
          aria-label="Calendar view"
        >
          <ToggleButton value="day" aria-label="Day view">
            <ViewDayIcon sx={{ mr: 0.5, fontSize: 18 }} />
            Day
          </ToggleButton>
          <ToggleButton value="week" aria-label="Week view">
            <CalendarViewWeekIcon sx={{ mr: 0.5, fontSize: 18 }} />
            Week
          </ToggleButton>
          <ToggleButton value="month" aria-label="Month view">
            <CalendarMonthIcon sx={{ mr: 0.5, fontSize: 18 }} />
            Month
          </ToggleButton>
        </ToggleButtonGroup>

        <Button variant="outlined" size="small" onClick={onPrev} startIcon={<ChevronLeftIcon />}>
          Prev
        </Button>
        <Button variant="outlined" size="small" onClick={onToday}>
          Today
        </Button>
        <Button variant="outlined" size="small" onClick={onNext} endIcon={<ChevronRightIcon />}>
          Next
        </Button>
      </Box>
    </Box>
  );
}
