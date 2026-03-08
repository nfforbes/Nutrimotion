/**
 * Admin Meal Scheduling Page with Calendar
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Chip,
  IconButton,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import { MealSlot } from '@/types/catalog';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

export default function AdminMealSchedulePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<MealSlot | null>(null);
  const [meals, setMeals] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    price: '',
    instagramLink: '',
    slot: MealSlot.BREAKFAST,
    scheduledDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    // TODO: Fetch meals for selected date
  }, [selectedDate]);

  const handleDateClick = (date: Date, slot: MealSlot) => {
    setSelectedDate(date);
    setSelectedSlot(slot);
    setFormData({
      ...formData,
      scheduledDate: format(date, 'yyyy-MM-dd'),
      slot,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    // TODO: Create meal via API
    console.log('Create meal:', formData);
    setDialogOpen(false);
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      price: '',
      instagramLink: '',
      slot: MealSlot.BREAKFAST,
      scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const slots = Object.values(MealSlot);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CalendarTodayIcon fontSize="large" color="primary" />
            <Typography variant="h4">
              Meal Scheduling
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
            >
              Previous Week
            </Button>
            <Button
              variant="outlined"
              onClick={() => setSelectedDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outlined"
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
            >
              Next Week
            </Button>
          </Box>
        </Box>

        <Card>
          <CardContent>
            <Box sx={{ overflowX: 'auto' }}>
              <Box sx={{ minWidth: 800 }}>
                <Grid container spacing={1}>
                  <Grid size={{ xs: 12 }}>
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 2 }}>
                        <Typography variant="subtitle2" sx={{ p: 1, fontWeight: 'bold' }}>
                          Time Slot
                        </Typography>
                      </Grid>
                      {weekDays.map((day) => (
                        <Grid size={{ xs: 10 / 7 }} key={day.toString()}>
                          <Typography
                            variant="subtitle2"
                            align="center"
                            sx={{
                              p: 1,
                              fontWeight: 'bold',
                              bgcolor: isSameDay(day, new Date()) ? 'primary.light' : 'transparent',
                            }}
                          >
                            {format(day, 'EEE MMM d')}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>

                  {slots.map((slot) => (
                    <Grid size={{ xs: 12 }} key={slot}>
                      <Grid container spacing={1}>
                        <Grid size={{ xs: 2 }}>
                          <Chip
                            label={slot.charAt(0).toUpperCase() + slot.slice(1)}
                            color="primary"
                            sx={{ width: '100%' }}
                          />
                        </Grid>
                        {weekDays.map((day) => (
                          <Grid size={{ xs: 10 / 7 }} key={`${slot}-${day.toString()}`}>
                            <Box
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                p: 1,
                                minHeight: 100,
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: 'action.hover',
                                },
                              }}
                              onClick={() => handleDateClick(day, slot)}
                            >
                              {/* TODO: Show meals for this day/slot */}
                              <Button
                                size="small"
                                startIcon={<AddIcon />}
                                fullWidth
                                variant="outlined"
                              >
                                Add Meal
                              </Button>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Add Meal - {selectedSlot && selectedSlot.charAt(0).toUpperCase() + selectedSlot.slice(1)} -{' '}
          {format(selectedDate, 'PPP')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Meal Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Image URL"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Meal Slot"
                value={formData.slot}
                onChange={(e) => setFormData({ ...formData, slot: e.target.value as MealSlot })}
              >
                <MenuItem value={MealSlot.BREAKFAST}>Breakfast</MenuItem>
                <MenuItem value={MealSlot.LUNCH}>Lunch</MenuItem>
                <MenuItem value={MealSlot.DINNER}>Dinner</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Scheduled Date"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Instagram Link (Optional)"
                value={formData.instagramLink}
                onChange={(e) => setFormData({ ...formData, instagramLink: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Create Meal
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
