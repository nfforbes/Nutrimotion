/**
 * Shared meal cell for day/week timetable grids.
 */

'use client';

import { Box, Button, IconButton, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { MealCalendarDoc } from '@/lib/meals/calendar';

export interface MealCellProps {
  meals: MealCalendarDoc[];
  highlighted?: boolean;
  minHeight?: number;
  onAdd: () => void;
  onEdit: (meal: MealCalendarDoc) => void;
  onDelete: (meal: MealCalendarDoc) => void;
}

export default function MealCell({
  meals,
  highlighted = false,
  minHeight = 100,
  onAdd,
  onEdit,
  onDelete,
}: MealCellProps) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: highlighted ? 'primary.main' : 'divider',
        bgcolor: highlighted ? 'action.selected' : 'background.paper',
        borderRadius: 1,
        p: 1,
        minHeight,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        height: '100%',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
        {meals.length === 0 ? (
          <Typography variant="caption" color="text.secondary">
            No meals
          </Typography>
        ) : (
          meals.map((meal) => (
            <Box
              key={meal._id}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 0.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                px: 0.75,
                py: 0.5,
                bgcolor: 'background.default',
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" fontWeight={600} noWrap display="block">
                  {meal.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ${meal.price}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexShrink: 0 }}>
                <IconButton
                  size="small"
                  aria-label={`Edit ${meal.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(meal);
                  }}
                >
                  <EditIcon sx={{ fontSize: 14 }} />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  aria-label={`Delete ${meal.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(meal);
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            </Box>
          ))
        )}
      </Box>
      <Button
        size="small"
        startIcon={<AddIcon />}
        fullWidth
        variant="outlined"
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
      >
        Add
      </Button>
    </Box>
  );
}
