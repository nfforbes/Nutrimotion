'use client';

import { useState, type ReactNode } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Avatar, Box, Chip, IconButton, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import type { MealSlot } from '@/types/catalog';
import { formatPrice, type DragData, type PlacedMeal, type PlacedMealActions } from './types';

interface PlacedMealChipProps extends PlacedMealActions {
  meal: PlacedMeal;
  weekStart: string;
  slot: MealSlot;
  compact?: boolean;
  busy?: boolean;
}

const BADGE_SX = { height: 18, fontSize: 11 };

export default function PlacedMealChip({
  meal,
  weekStart,
  slot,
  compact = false,
  busy = false,
  onToggle,
  onFill,
  onRemove,
}: PlacedMealChipProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const data: DragData = { kind: 'placed', meal, weekStart, slot };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `placed:${weekStart}:${slot}:${meal.name}`,
    data,
    disabled: busy,
  });

  const partial = meal.days < 7;
  const check = (on: boolean) => (on ? <CheckBoxIcon fontSize="small" /> : <CheckBoxOutlineBlankIcon fontSize="small" />);
  const menuItems: { label: string; icon: ReactNode; run: () => void; danger?: boolean; hidden?: boolean }[] = [
    { label: 'Available to order', icon: check(meal.available), run: () => onToggle(weekStart, slot, meal, 'available') },
    { label: 'Packages only', icon: check(!meal.soldIndividually), run: () => onToggle(weekStart, slot, meal, 'soldIndividually') },
    {
      label: 'Serve all 7 days',
      icon: <EventRepeatIcon fontSize="small" />,
      run: () => onFill(weekStart, slot, meal),
      hidden: !partial,
    },
    {
      label: 'Remove from this week',
      icon: <DeleteOutlineIcon fontSize="small" color="error" />,
      run: () => onRemove(weekStart, slot, meal),
      danger: true,
    },
  ];

  return (
    <>
      <Box
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: compact ? 0.5 : 1,
          pl: 1,
          borderRadius: 1.5,
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          opacity: isDragging || busy ? 0.4 : meal.available ? 1 : 0.65,
          cursor: busy ? 'progress' : 'grab',
          touchAction: 'none',
          '&:hover': { borderColor: 'primary.light' },
        }}
      >
        {!compact && (
          <Avatar
            variant="rounded"
            src={meal.imageUrl}
            alt={meal.name}
            sx={{ width: 40, height: 40, bgcolor: 'grey.200', color: 'grey.500' }}
          >
            <RestaurantIcon fontSize="small" />
          </Avatar>
        )}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant={compact ? 'caption' : 'body2'}
            sx={{ fontWeight: 600, display: 'block', lineHeight: 1.3 }}
            noWrap
            title={meal.name}
          >
            {meal.name}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: compact ? 0 : 0.25, alignItems: 'center' }}>
            {!compact && (
              <Typography variant="caption" color="text.secondary">
                {formatPrice(meal.price)}
              </Typography>
            )}
            {partial && <Chip size="small" color="warning" label={`${meal.days}/7 days`} sx={BADGE_SX} />}
            {!meal.available && <Chip size="small" label="Hidden" sx={BADGE_SX} />}
            {!meal.soldIndividually && <Chip size="small" variant="outlined" label="Packages only" sx={BADGE_SX} />}
          </Box>
        </Box>
        <IconButton
          size="small"
          aria-label={`Options for ${meal.name}`}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          disabled={busy}
          sx={{ p: compact ? 0.25 : 0.5 }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Box>
      <Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={() => setMenuAnchor(null)}>
        {menuItems
          .filter((item) => !item.hidden)
          .map((item) => (
            <MenuItem
              key={item.label}
              onClick={() => {
                setMenuAnchor(null);
                item.run();
              }}
              sx={item.danger ? { color: 'error.main' } : undefined}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              {item.label}
            </MenuItem>
          ))}
      </Menu>
    </>
  );
}
