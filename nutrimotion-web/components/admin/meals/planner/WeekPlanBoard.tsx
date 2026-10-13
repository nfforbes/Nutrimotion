'use client';

import { Box } from '@mui/material';
import { MEAL_SLOT_LABELS, MEAL_SLOT_ORDER } from '@/lib/meals/slots';
import SlotDropZone from './SlotDropZone';
import type { PlacedMealActions, WeekPlan } from './types';

interface WeekPlanBoardProps extends PlacedMealActions {
  plan: WeekPlan;
  busyKeys: Set<string>;
}

export default function WeekPlanBoard({ plan, busyKeys, ...actions }: WeekPlanBoardProps) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', xl: 'repeat(4, 1fr)' }, gap: 2 }}>
      {MEAL_SLOT_ORDER.map((slot) => (
        <SlotDropZone
          key={slot}
          title={MEAL_SLOT_LABELS[slot]}
          weekStart={plan.weekStart}
          slot={slot}
          meals={plan.slots[slot]}
          busyKeys={busyKeys}
          {...actions}
        />
      ))}
    </Box>
  );
}
