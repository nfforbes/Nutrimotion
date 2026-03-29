/**
 * Add Meal Form Component
 * Shown in place of the meal list when admin clicks "Add Meal".
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  MenuItem,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { MealSlot } from '@/types/catalog';
import axios from 'axios';

const initialFormData = {
  name: '',
  description: '',
  imageUrl: '',
  price: '',
  instagramLink: '',
  slot: MealSlot.BREAKFAST,
  scheduledDate: new Date().toISOString().split('T')[0],
};

function formatScheduledDate(value: string | Date | undefined): string {
  if (!value) return new Date().toISOString().split('T')[0];
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toISOString().split('T')[0];
}

export interface MealFormInitial {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  slot: string;
  scheduledDate: string | Date;
  instagramLink?: string;
}

export interface AddMealFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  /** When set, form updates this meal (PATCH) instead of creating (POST). */
  initialMeal?: MealFormInitial | null;
}

export default function AddMealForm({ onSuccess, onCancel, initialMeal }: AddMealFormProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingMeals, setExistingMeals] = useState<Array<{ _id: string; name: string; description?: string; imageUrl?: string; price: number; slot: string; scheduledDate: string | Date; instagramLink?: string }>>([]);
  const [copyFromId, setCopyFromId] = useState<string>('');

  const isEdit = Boolean(initialMeal?._id);

  useEffect(() => {
    if (initialMeal?._id) {
      setFormData({
        name: initialMeal.name ?? '',
        description: initialMeal.description ?? '',
        imageUrl: initialMeal.imageUrl ?? '',
        price: String(initialMeal.price ?? ''),
        instagramLink: initialMeal.instagramLink ?? '',
        slot: (initialMeal.slot as MealSlot) ?? MealSlot.BREAKFAST,
        scheduledDate: formatScheduledDate(initialMeal.scheduledDate),
      });
      setCopyFromId('');
      setError(null);
    } else {
      setFormData(initialFormData);
      setCopyFromId('');
      setError(null);
    }
  }, [initialMeal]);

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const res = await axios.get('/api/admin/meals');
        setExistingMeals(Array.isArray(res.data) ? res.data : []);
      } catch {
        setExistingMeals([]);
      }
    };
    fetchMeals();
  }, []);

  const handleCopyFromMeal = (mealId: string) => {
    setCopyFromId(mealId);
    if (!mealId) return;
    const meal = existingMeals.find((m) => m._id === mealId);
    if (!meal) return;
    setFormData({
      name: meal.name ?? '',
      description: meal.description ?? '',
      imageUrl: meal.imageUrl ?? '',
      price: String(meal.price ?? ''),
      instagramLink: meal.instagramLink ?? '',
      slot: (meal.slot as MealSlot) ?? MealSlot.BREAKFAST,
      scheduledDate: formatScheduledDate(meal.scheduledDate),
    });
  };

  const handleSubmit = async () => {
    setError(null);

    const name = formData.name?.trim();
    const description = formData.description?.trim();
    const imageUrl = formData.imageUrl?.trim();
    const priceNum = parseFloat(formData.price);
    const priceValid = !Number.isNaN(priceNum) && priceNum >= 0;

    if (!name || !description || !priceValid || !formData.slot || !formData.scheduledDate) {
      setError('Please fill all required fields (Name, Description, Price, Slot, Scheduled Date).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        description,
        imageUrl: imageUrl || undefined,
        price: priceNum,
        instagramLink: formData.instagramLink?.trim() || undefined,
        slot: formData.slot,
        scheduledDate: formData.scheduledDate,
      };
      if (isEdit && initialMeal?._id) {
        await axios.patch(`/api/admin/meals/${initialMeal._id}`, payload);
      } else {
        await axios.post('/api/admin/meals', payload);
      }
      setFormData(initialFormData);
      setCopyFromId('');
      onSuccess();
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : err instanceof Error
            ? err.message
            : isEdit
              ? 'Failed to update meal'
              : 'Failed to create meal';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onCancel}
            size="small"
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Typography variant="h6">{isEdit ? 'Edit Meal' : 'Add New Meal'}</Typography>
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Box
          component="form"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            label="Scheduled Date"
            type="date"
            value={formData.scheduledDate}
            onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
          />
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

          <TextField
            fullWidth
            label="Meal Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          {!isEdit && (
            <TextField
              fullWidth
              select
              label="Copy from existing meal"
              value={copyFromId}
              onChange={(e) => handleCopyFromMeal(e.target.value)}
              sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
            >
              <MenuItem value="">— New meal (do not copy) —</MenuItem>
              {existingMeals.map((meal) => (
                <MenuItem key={meal._id} value={meal._id}>
                  {meal.name} {meal.slot ? `(${meal.slot})` : ''}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />

          <TextField
            fullWidth
            label="Image URL"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          />
          <TextField
            fullWidth
            label="Price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />

          <TextField
            fullWidth
            label="Instagram Link (Optional)"
            value={formData.instagramLink}
            onChange={(e) => setFormData({ ...formData, instagramLink: e.target.value })}
          />

          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={submitting}
              >
                {submitting ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save Changes' : 'Create Meal'}
              </Button>
              <Button onClick={onCancel} variant="outlined">
                Cancel
              </Button>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
