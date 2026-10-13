'use client';

import { useMemo, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { MEAL_SLOT_LABELS, MEAL_SLOT_ORDER } from '@/lib/meals/slots';
import type { MealSlot } from '@/types/catalog';
import { formatPrice, type CatalogMeal, type DragData } from './types';

interface MealPaletteProps {
  meals: CatalogMeal[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (meal: CatalogMeal) => void;
}

function PaletteMeal({ meal, onEdit }: { meal: CatalogMeal; onEdit: (meal: CatalogMeal) => void }) {
  const data: DragData = { kind: 'catalog', meal };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `catalog:${meal._id}`, data });

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 0.75,
        borderRadius: 1.5,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        cursor: 'grab',
        touchAction: 'none',
        opacity: isDragging ? 0.4 : 1,
        '&:hover': { borderColor: 'primary.light', boxShadow: 1 },
      }}
    >
      <Avatar variant="rounded" src={meal.imageUrl} alt={meal.name} sx={{ width: 36, height: 36, bgcolor: 'grey.200', color: 'grey.500' }}>
        <RestaurantIcon fontSize="small" />
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={meal.name}>
          {meal.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {MEAL_SLOT_LABELS[meal.slot]} · {formatPrice(meal.price)}
          {meal.soldIndividually ? '' : ' · Packages only'}
        </Typography>
      </Box>
      <Tooltip title="Edit meal">
        <IconButton
          size="small"
          aria-label={`Edit ${meal.name}`}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onClick={() => onEdit(meal)}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default function MealPalette({ meals, loading, onAdd, onEdit }: MealPaletteProps) {
  const [query, setQuery] = useState('');
  const [slot, setSlot] = useState<MealSlot | 'all'>('all');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return meals.filter((m) => (slot === 'all' || m.slot === slot) && (!q || m.name.toLowerCase().includes(q)));
  }, [meals, query, slot]);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        position: { md: 'sticky' },
        top: { md: 80 },
        maxHeight: { md: 'calc(100vh - 100px)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Meals</Typography>
        <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
          New meal
        </Button>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Drag a meal onto a slot to serve it every day of that week.
      </Typography>
      <TextField
        size="small"
        placeholder="Search meals"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        <Chip size="small" label="All" color={slot === 'all' ? 'primary' : 'default'} onClick={() => setSlot('all')} />
        {MEAL_SLOT_ORDER.map((s) => (
          <Chip
            key={s}
            size="small"
            label={MEAL_SLOT_LABELS[s]}
            color={slot === s ? 'primary' : 'default'}
            onClick={() => setSlot(s)}
          />
        ))}
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, overflowY: 'auto', minHeight: 0, pr: 0.5 }}>
        {loading && meals.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Loading meals…
          </Typography>
        ) : visible.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {meals.length === 0 ? 'No meals yet. Add your first meal.' : 'No meals match.'}
          </Typography>
        ) : (
          visible.map((meal) => <PaletteMeal key={meal._id} meal={meal} onEdit={onEdit} />)
        )}
      </Box>
    </Paper>
  );
}
