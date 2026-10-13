'use client';

import { useDroppable } from '@dnd-kit/core';
import { Box, Typography } from '@mui/material';
import type { MealSlot } from '@/types/catalog';
import PlacedMealChip from './PlacedMealChip';
import { zoneId, type DropData, type PlacedMeal, type PlacedMealActions } from './types';

interface SlotDropZoneProps extends PlacedMealActions {
  weekStart: string;
  slot: MealSlot;
  meals: PlacedMeal[];
  compact?: boolean;
  busyKeys: Set<string>;
  title?: string;
}

export function busyKey(weekStart: string, slot: MealSlot, name: string): string {
  return `${weekStart}|${slot}|${name}`;
}

export default function SlotDropZone({ weekStart, slot, meals, compact = false, busyKeys, title, ...actions }: SlotDropZoneProps) {
  const data: DropData = { weekStart, slot };
  const { setNodeRef, isOver } = useDroppable({ id: zoneId(weekStart, slot), data });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? 0.5 : 1,
        p: compact ? 0.75 : 1.5,
        minHeight: compact ? 64 : 180,
        height: '100%',
        borderRadius: 2,
        border: 2,
        borderStyle: 'dashed',
        borderColor: isOver ? 'primary.main' : 'divider',
        bgcolor: isOver ? 'action.hover' : 'grey.50',
        transition: 'border-color 120ms, background-color 120ms',
      }}
    >
      {title && (
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {title}
          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {meals.length}
          </Typography>
        </Typography>
      )}
      {meals.map((meal) => (
        <PlacedMealChip
          key={meal.name}
          meal={meal}
          weekStart={weekStart}
          slot={slot}
          compact={compact}
          busy={busyKeys.has(busyKey(weekStart, slot, meal.name))}
          {...actions}
        />
      ))}
      {meals.length === 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
        >
          {compact ? 'Drop here' : 'Drag meals here'}
        </Typography>
      )}
    </Box>
  );
}
