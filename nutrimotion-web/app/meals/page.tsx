'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMealsRequest } from '@/store/slices/catalogSlice';
import { addToCartRequest } from '@/store/slices/cartSlice';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import { MealSlot } from '@/types/catalog';
import axios from 'axios';
import PackageSelection from '@/components/client/PackageSelection';
import { getLocalCalendarDayKey } from '@/lib/calendarDayKey';

const SLOT_LABELS: Record<string, string> = {
  [MealSlot.BREAKFAST]: 'Breakfast',
  [MealSlot.LUNCH]: 'Lunch',
  [MealSlot.DINNER]: 'Dinner',
};
const SLOT_ORDER = [MealSlot.BREAKFAST, MealSlot.LUNCH, MealSlot.DINNER];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_LABELS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface PackageDoc {
  _id: string;
  name: string;
  description?: string;
  breakfastCount: number;
  lunchCount: number;
  dinnerCount: number;
  cost?: number;
  daysOption: 'any' | 'specific';
  specificDays: number[];
}

function getWeekStart(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return date;
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function MealsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [packages, setPackages] = useState<PackageDoc[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<PackageDoc | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const { meals, isLoading } = useAppSelector((state) => state.catalog);
  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchMealsRequest());
    axios
      .get<PackageDoc[]>('/api/packages')
      .then((res) => setPackages(Array.isArray(res.data) ? res.data : []))
      .catch(() => setPackages([]));
  }, [dispatch]);

  const handleAddToCart = (meal: any) => {
    dispatch(
      addToCartRequest({
        itemType: 'meal',
        itemId: meal.id || meal._id,
        name: meal.name,
        price: meal.price,
        quantity: 1,
        imageUrl: meal.imageUrl,
      })
    );
    setSnackbarMessage(`${meal.name} added to cart`);
  };

  const handleAddPackageToCart = (pkg: PackageDoc, selections: Record<string, Record<string, any[]>>) => {
    const packageDetails: Record<string, { breakfast?: string[]; lunch?: string[]; dinner?: string[] }> = {};

    Object.keys(selections).forEach((dateIso) => {
      const daySels = selections[dateIso];
      packageDetails[dateIso] = {
        breakfast: daySels[MealSlot.BREAKFAST]?.map(m => m.name),
        lunch: daySels[MealSlot.LUNCH]?.map(m => m.name),
        dinner: daySels[MealSlot.DINNER]?.map(m => m.name),
      };
    });

    dispatch(
      addToCartRequest({
        itemType: 'package',
        itemId: pkg._id,
        name: pkg.name,
        price: pkg.cost || 0,
        quantity: 1,
        packageDetails,
      })
    );
    setSelectedPackage(null); // Return to default view
    setSnackbarMessage(`Package ${pkg.name} added to cart`);
  };

  const weekStart = useMemo(() => {
    const now = new Date();
    const ws = getWeekStart(now);
    ws.setDate(ws.getDate() + weekOffset * 7);
    return ws;
  }, [weekOffset]);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const mealsByDaySlot = useMemo(() => {
    const map: Record<string, Record<string, any[]>> = {};
    for (const day of weekDays) {
      const key = getLocalCalendarDayKey(day);
      map[key] = {};
      SLOT_ORDER.forEach((slot) => (map[key][slot] = []));
    }
    for (const meal of meals) {
      const d = new Date(meal.scheduledDate);
      const key = getLocalCalendarDayKey(d);
      if (map[key]) {
        const slot = meal.slot in SLOT_LABELS ? meal.slot : MealSlot.BREAKFAST;
        map[key][slot].push(meal);
      }
    }
    return map;
  }, [meals, weekDays]);

  const weekLabel = `${formatDate(weekDays[0])} – ${formatDate(weekDays[6])}`;

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {selectedPackage ? (
          <PackageSelection
            pkg={selectedPackage}
            weekDays={weekDays}
            mealsByDaySlot={mealsByDaySlot}
            onCancel={() => setSelectedPackage(null)}
            onAddToCart={handleAddPackageToCart}
          />
        ) : (
          <>
            {/* ── Meal Packages ── */}
            <Typography variant="h4" gutterBottom>
              Meal Packages
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Choose a package that fits your schedule
            </Typography>

            {packages.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                No packages available at the moment.
              </Typography>
            ) : (
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {packages.map((pkg) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pkg._id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {pkg.name}
                        </Typography>
                        {pkg.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {pkg.description}
                          </Typography>
                        )}
                        <Typography variant="body2">
                          {pkg.breakfastCount} breakfast{pkg.breakfastCount === 1 ? '' : 's'} · {pkg.lunchCount} lunch
                          {pkg.lunchCount === 1 ? '' : 'es'} · {pkg.dinnerCount} dinner{pkg.dinnerCount === 1 ? '' : 's'}{' '}
                          <Typography component="span" variant="body2" color="text.secondary">
                            (package total)
                          </Typography>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {pkg.daysOption === 'any'
                            ? 'Any days'
                            : `Days: ${pkg.specificDays.map((d) => DAY_LABELS_SHORT[d]).join(', ')}`}
                        </Typography>
                        <Typography variant="body2" fontWeight="medium" sx={{ mt: 1 }}>
                          ${(pkg.cost ?? 0).toFixed(2)}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<AddShoppingCartIcon />}
                          onClick={() => setSelectedPackage(pkg)}
                        >
                          Select Package
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            <Divider sx={{ mb: 4 }} />

            {/* ── Weekly Meals ── */}
            <Typography variant="h4" gutterBottom>
              Meals
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Browse meals by day — breakfast, lunch and dinner
            </Typography>

            {/* Week navigation */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
              <Button size="small" startIcon={<ChevronLeftIcon />} onClick={() => setWeekOffset((o) => o - 1)}>
                Previous
              </Button>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {weekLabel}
              </Typography>
              <Button size="small" endIcon={<ChevronRightIcon />} onClick={() => setWeekOffset((o) => o + 1)}>
                Next
              </Button>
            </Box>

            {/* Day tabs */}
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 3 }}
            >
              {weekDays.map((day, i) => (
                <Tab key={i} label={`${DAY_NAMES[day.getDay()]} ${formatDate(day)}`} />
              ))}
            </Tabs>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              (() => {
                const dayKey = getLocalCalendarDayKey(weekDays[activeTab]);
                const daySlots = mealsByDaySlot[dayKey] || {};
                const hasAny = SLOT_ORDER.some((s) => (daySlots[s] || []).length > 0);

                if (!hasAny) {
                  return (
                    <Typography variant="body1" align="center" color="text.secondary" sx={{ mt: 4 }}>
                      No meals scheduled for this day.
                    </Typography>
                  );
                }

                return (
                  <Grid container spacing={3}>
                    {SLOT_ORDER.map((slot) => {
                      const slotMeals = daySlots[slot] || [];
                      return (
                        <Grid size={{ xs: 12, md: 4 }} key={slot}>
                          <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                            {SLOT_LABELS[slot]}
                          </Typography>
                          {slotMeals.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No {SLOT_LABELS[slot].toLowerCase()} options
                            </Typography>
                          ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {slotMeals.map((meal: any) => (
                                <Card key={meal.id || meal._id}>
                                  <CardMedia
                                    component="img"
                                    height="160"
                                    image={meal.imageUrl || '/placeholder-meal.jpg'}
                                    alt={meal.name}
                                  />
                                  <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        {meal.name}
                                      </Typography>
                                      <Typography variant="subtitle1" color="primary">
                                        ${meal.price}
                                      </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                      {meal.description}
                                    </Typography>
                                    {meal.nutritionInfo && (
                                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                        {meal.nutritionInfo.calories} cal · {meal.nutritionInfo.protein}g protein
                                      </Typography>
                                    )}
                                  </CardContent>
                                  <CardActions>
                                    <Button
                                      fullWidth
                                      variant="contained"
                                      size="small"
                                      startIcon={<AddShoppingCartIcon />}
                                      onClick={() => handleAddToCart(meal)}
                                    >
                                      Add to Cart
                                    </Button>
                                  </CardActions>
                                </Card>
                              ))}
                            </Box>
                          )}
                        </Grid>
                      );
                    })}
                  </Grid>
                );
              })()
            )}
          </>
        )}
      </Container>
      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={4000}
        onClose={() => setSnackbarMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarMessage(null)} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
