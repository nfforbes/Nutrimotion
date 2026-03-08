/**
 * Admin Meals Management Page
 * Shows meals grouped by week, with Breakfast / Lunch / Dinner sections per week.
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Box,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import AddMealForm from '@/components/admin/AddMealForm';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import { MealSlot } from '@/types/catalog';
import axios from 'axios';

const SLOT_LABELS: Record<string, string> = {
  [MealSlot.BREAKFAST]: 'Breakfast',
  [MealSlot.LUNCH]: 'Lunch',
  [MealSlot.DINNER]: 'Dinner',
};

const SLOT_ORDER = [MealSlot.BREAKFAST, MealSlot.LUNCH, MealSlot.DINNER];

interface MealDoc {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  slot: string;
  scheduledDate: string;
  available?: boolean;
}

/** Get Sunday 00:00:00 of the week containing the given date (week starts Sunday). */
function getWeekStart(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  return date;
}

function formatWeekLabel(weekStart: Date): string {
  return weekStart.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMealDate(s: string): string {
  return new Date(s).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminMealsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [meals, setMeals] = useState<MealDoc[]>([]);

  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      const response = await axios.get<MealDoc[]>('/api/admin/meals');
      setMeals(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch meals:', error);
    }
  };

  const mealsByWeek = useMemo(() => {
    const map = new Map<string, Map<string, MealDoc[]>>();
    for (const meal of meals) {
      const d = new Date(meal.scheduledDate);
      const weekStart = getWeekStart(d);
      const weekKey = weekStart.toISOString().slice(0, 10);
      if (!map.has(weekKey)) {
        map.set(weekKey, new Map());
        SLOT_ORDER.forEach((slot) => map.get(weekKey)!.set(slot, []));
      }
      const slot = meal.slot in SLOT_LABELS ? meal.slot : MealSlot.BREAKFAST;
      map.get(weekKey)!.get(slot)!.push(meal);
    }
    map.forEach((slotMap) => {
      slotMap.forEach((arr) =>
        arr.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
      );
    });
    const weekKeys = Array.from(map.keys()).sort();
    return { weekKeys, map };
  }, [meals]);

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Meal Management</Typography>
          {!showAddForm && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddForm(true)}>
              Add Meal
            </Button>
          )}
        </Box>

        {showAddForm ? (
          <AddMealForm
            onSuccess={() => {
              setShowAddForm(false);
              fetchMeals();
            }}
            onCancel={() => setShowAddForm(false)}
          />
        ) : meals.length === 0 ? (
          <Typography color="text.secondary">
            No meals yet. Click &quot;Add Meal&quot; to create one.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {mealsByWeek.weekKeys.map((weekKey) => {
              const weekStart = new Date(weekKey);
              const slotMap = mealsByWeek.map.get(weekKey)!;
              return (
                <Card key={weekKey} variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Week of {formatWeekLabel(weekStart)}
                    </Typography>
                    <Grid container spacing={3}>
                      {SLOT_ORDER.map((slot) => {
                        const slotMeals = slotMap.get(slot) || [];
                        return (
                          <Grid size={{ xs: 12, md: 4 }} key={slot}>
                            <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                              {SLOT_LABELS[slot]}
                            </Typography>
                            {slotMeals.length === 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                No meals
                              </Typography>
                            ) : (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {slotMeals.map((meal) => (
                                  <Card key={meal._id} variant="outlined" sx={{ overflow: 'hidden' }}>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                                      <CardMedia
                                        component="img"
                                        height="120"
                                        sx={{ width: { xs: '100%', sm: 140 }, minWidth: 140 }}
                                        image={meal.imageUrl || '/placeholder-meal.jpg'}
                                        alt={meal.name}
                                      />
                                      <Box sx={{ flex: 1, p: 1.5 }}>
                                        <Typography variant="subtitle2">{meal.name}</Typography>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                          {formatMealDate(meal.scheduledDate)}
                                        </Typography>
                                        <Typography variant="body2" color="primary">
                                          ${meal.price}
                                        </Typography>
                                        <CardActions sx={{ px: 0 }}>
                                          <IconButton size="small">
                                            <EditIcon fontSize="small" />
                                          </IconButton>
                                          <IconButton size="small" color="error">
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </CardActions>
                                      </Box>
                                    </Box>
                                  </Card>
                                ))}
                              </Box>
                            )}
                          </Grid>
                        );
                      })}
                    </Grid>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Container>
    </>
  );
}
