'use client';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { MEAL_SLOT_LABELS, MEAL_SLOT_ORDER } from '@/lib/meals/slots';
import { addDays, formatDayKey } from '@/lib/orders/orderWeek';
import SlotDropZone from './SlotDropZone';
import type { PlacedMealActions, WeekPlan } from './types';

interface MonthPlanBoardProps extends PlacedMealActions {
  plans: WeekPlan[];
  busyKeys: Set<string>;
  currentWeekStart: string;
  orderingWeekStart: string;
  onOpenWeek: (weekStart: string) => void;
  onCopyWeek: (weekStart: string) => void;
}

const GRID_COLUMNS = { xs: '1fr', md: '140px repeat(4, minmax(0, 1fr))' };

export default function MonthPlanBoard({
  plans,
  busyKeys,
  currentWeekStart,
  orderingWeekStart,
  onOpenWeek,
  onCopyWeek,
  ...actions
}: MonthPlanBoardProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: GRID_COLUMNS, gap: 1, px: 0.5 }}>
        <span />
        {MEAL_SLOT_ORDER.map((slot) => (
          <Typography key={slot} variant="subtitle2" sx={{ fontWeight: 700 }}>
            {MEAL_SLOT_LABELS[slot]}
          </Typography>
        ))}
      </Box>
      {plans.map((plan) => {
        const isCurrent = plan.weekStart === currentWeekStart;
        return (
          <Box
            key={plan.weekStart}
            sx={{
              display: 'grid',
              gridTemplateColumns: GRID_COLUMNS,
              gap: 1,
              p: 0.5,
              borderRadius: 2,
              outline: isCurrent ? 2 : 0,
              outlineColor: 'primary.light',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, alignItems: { xs: 'center', md: 'flex-start' }, gap: 0.5 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                onClick={() => onOpenWeek(plan.weekStart)}
                title="Open this week"
              >
                {formatDayKey(plan.weekStart)} – {formatDayKey(addDays(plan.weekStart, 6))}
              </Typography>
              {isCurrent && (
                <Typography variant="caption" color="primary">
                  This week
                </Typography>
              )}
              {plan.weekStart === orderingWeekStart && (
                <Typography variant="caption" color="success.main">
                  Clients ordering now
                </Typography>
              )}
              <Tooltip title="Copy this week to another week">
                <IconButton size="small" onClick={() => onCopyWeek(plan.weekStart)}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            {MEAL_SLOT_ORDER.map((slot) => (
              <SlotDropZone
                key={slot}
                compact
                weekStart={plan.weekStart}
                slot={slot}
                meals={plan.slots[slot]}
                busyKeys={busyKeys}
                {...actions}
              />
            ))}
          </Box>
        );
      })}
    </Box>
  );
}
