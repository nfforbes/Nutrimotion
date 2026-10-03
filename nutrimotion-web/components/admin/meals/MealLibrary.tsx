'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';
import { MealSlot } from '@/types/catalog';
import { MENU_PRICES, WEEK_MENUS } from '@/lib/meals/weeklyMenus';

interface LibraryMeal {
  name: string;
  slot: string;
  price: number;
  description: string;
}

interface LibraryMenu {
  label: string;
  weekStart: string;
  meals: LibraryMeal[];
}

const SLOT_LABELS: Record<string, string> = {
  [MealSlot.BREAKFAST]: 'Breakfast',
  [MealSlot.LUNCH]: 'Lunch',
  [MealSlot.SMOOTHIES]: 'Smoothie',
  [MealSlot.JUICE_SHOT]: 'Juice shot',
};

export default function MealLibrary({ onBack }: { onBack: () => void }) {
  const [menus, setMenus] = useState<LibraryMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    menuLabel: WEEK_MENUS[0].label,
    weekStart: '',
    slot: MealSlot.LUNCH,
    name: '',
    price: String(MENU_PRICES[MealSlot.LUNCH]),
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<{ menus: LibraryMenu[] }>('/api/admin/meals/library');
      const next = Array.isArray(res.data.menus) ? res.data.menus : [];
      setMenus(next);
      setForm((prev) => ({
        ...prev,
        weekStart: prev.weekStart || next[0]?.weekStart || new Date().toISOString().slice(0, 10),
        menuLabel: prev.menuLabel || next[0]?.label || WEEK_MENUS[0].label,
      }));
    } catch {
      setError('Failed to load meals.');
      setMenus([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleMenuChange = (label: string) => {
    const existing = menus.find((menu) => menu.label === label);
    setForm((prev) => ({
      ...prev,
      menuLabel: label,
      weekStart: existing?.weekStart || prev.weekStart,
    }));
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.menuLabel.trim() || !form.weekStart) {
      setError('Name, menu, and week start are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await axios.post('/api/admin/meals/library', {
        name: form.name.trim(),
        slot: form.slot,
        menuLabel: form.menuLabel.trim(),
        weekStart: form.weekStart,
        price: form.price === '' ? undefined : Number(form.price),
      });
      setForm((prev) => ({ ...prev, name: '' }));
      setShowAdd(false);
      await load();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to add meal.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (menu: LibraryMenu, meal: LibraryMeal) => {
    if (!window.confirm(`Remove "${meal.name}" from ${menu.label}?`)) return;
    try {
      await axios.delete('/api/admin/meals/library', {
        data: {
          name: meal.name,
          slot: meal.slot,
          menuLabel: menu.label,
          weekStart: menu.weekStart,
        },
      });
      await load();
    } catch {
      setError('Failed to remove meal.');
    }
  };

  const menuChoices = Array.from(new Set([...WEEK_MENUS.map((menu) => menu.label), ...menus.map((menu) => menu.label)]));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>
          Back to calendar
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAdd((open) => !open)}>
          Add meal
        </Button>
      </Box>

      <Typography variant="h5" gutterBottom>
        Meals
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Add or remove a meal here. Each meal is offered every day of its week.
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {showAdd && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <TextField
              select
              label="Menu"
              value={form.menuLabel}
              onChange={(e) => handleMenuChange(e.target.value)}
            >
              {menuChoices.map((label) => (
                <MenuItem key={label} value={label}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Week starting"
              type="date"
              value={form.weekStart}
              onChange={(e) => setForm({ ...form, weekStart: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Sunday of that menu week"
            />
            <TextField
              select
              label="Slot"
              value={form.slot}
              onChange={(e) => {
                const slot = e.target.value as MealSlot;
                setForm({ ...form, slot, price: String(MENU_PRICES[slot] ?? 0) });
              }}
            >
              <MenuItem value={MealSlot.BREAKFAST}>Breakfast</MenuItem>
              <MenuItem value={MealSlot.LUNCH}>Lunch</MenuItem>
              <MenuItem value={MealSlot.SMOOTHIES}>Smoothie</MenuItem>
              <MenuItem value={MealSlot.JUICE_SHOT}>Juice shot</MenuItem>
            </TextField>
            <TextField
              label="Price"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <TextField
              label="Meal name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
            />
            <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
              <Button variant="contained" onClick={handleAdd} disabled={saving}>
                {saving ? 'Saving…' : 'Save meal'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Typography color="text.secondary">Loading meals…</Typography>
      ) : menus.length === 0 ? (
        <Typography color="text.secondary">No meals yet.</Typography>
      ) : (
        menus.map((menu) => (
          <Box key={`${menu.label}-${menu.weekStart}`} sx={{ mb: 3 }}>
            <Typography variant="h6">{menu.label}</Typography>
            <Typography variant="caption" color="text.secondary">
              Week of {menu.weekStart}
            </Typography>
            <List dense>
              {menu.meals.map((meal) => (
                <ListItem
                  key={`${meal.slot}-${meal.name}`}
                  secondaryAction={
                    <IconButton edge="end" aria-label={`Remove ${meal.name}`} onClick={() => handleRemove(menu, meal)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                  sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                  <ListItemText
                    primary={meal.name}
                    secondary={`$${meal.price.toFixed(2)}`}
                  />
                  <Chip size="small" label={SLOT_LABELS[meal.slot] || meal.slot} sx={{ mr: 1 }} />
                </ListItem>
              ))}
            </List>
          </Box>
        ))
      )}
    </Box>
  );
}
