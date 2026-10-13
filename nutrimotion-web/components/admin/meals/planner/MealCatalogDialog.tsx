'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { MEAL_SLOT_LABELS, MEAL_SLOT_ORDER } from '@/lib/meals/slots';
import { MENU_PRICES } from '@/lib/meals/weeklyMenus';
import { MealSlot } from '@/types/catalog';
import MealPhotoDialog from '../MealPhotoDialog';
import type { CatalogMeal } from './types';

interface MealCatalogDialogProps {
  open: boolean;
  /** The meal being edited; null to create a new one. */
  meal: CatalogMeal | null;
  onClose: () => void;
  /** Called after any save, photo change or delete so the page can reload. */
  onChanged: (meal: CatalogMeal | null) => void;
}

interface FormState {
  name: string;
  slot: MealSlot;
  price: string;
  description: string;
  soldIndividually: boolean;
  instagramLink: string;
}

function formFor(meal: CatalogMeal | null): FormState {
  return {
    name: meal?.name ?? '',
    slot: meal?.slot ?? MealSlot.LUNCH,
    price: String(meal?.price ?? MENU_PRICES[MealSlot.LUNCH]),
    description: meal?.description ?? '',
    soldIndividually: meal?.soldIndividually ?? true,
    instagramLink: meal?.instagramLink ?? '',
  };
}

function errorMessage(error: unknown, fallback: string): string {
  return axios.isAxiosError(error) && error.response?.data?.error ? String(error.response.data.error) : fallback;
}

export default function MealCatalogDialog({ open, meal, onClose, onChanged }: MealCatalogDialogProps) {
  const [current, setCurrent] = useState<CatalogMeal | null>(meal);
  const [form, setForm] = useState<FormState>(() => formFor(meal));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  /** Photo chosen for a meal that hasn't been saved yet; attached when it is created. */
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCurrent(meal);
    setForm(formFor(meal));
    setError(null);
    setSaved(false);
    setPendingPhoto(null);
  }, [open, meal]);

  const photoUrl = current ? current.imageUrl : pendingPhoto ?? undefined;

  const update = (patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const body = { ...form, price: form.price === '' ? '' : Number(form.price) };
      const res = current
        ? await axios.patch<CatalogMeal>(`/api/admin/meals/catalog/${current._id}`, body)
        : await axios.post<CatalogMeal>('/api/admin/meals/catalog', body);
      let next = res.data;
      if (!current && pendingPhoto) {
        try {
          await axios.put('/api/admin/meals/photo', { name: next.name, imageUrl: pendingPhoto });
          next = { ...next, imageUrl: pendingPhoto };
          setPendingPhoto(null);
        } catch (err) {
          setError(errorMessage(err, 'The meal was saved, but its photo could not be attached. Try adding it again.'));
        }
      }
      setCurrent(next);
      setSaved(true);
      onChanged(next);
    } catch (err) {
      setError(errorMessage(err, 'Could not save the meal.'));
    } finally {
      setSaving(false);
    }
  };

  const savePhoto = async (imageUrl: string) => {
    if (!current) {
      setPendingPhoto(imageUrl || null);
      return;
    }
    await axios.put('/api/admin/meals/photo', { name: current.name, imageUrl });
    const next = { ...current, imageUrl: imageUrl || undefined };
    setCurrent(next);
    onChanged(next);
  };

  const removePhoto = async () => {
    if (!current) {
      setPendingPhoto(null);
      return;
    }
    if (!window.confirm(`Remove the photo from "${current.name}"?`)) return;
    setError(null);
    try {
      await savePhoto('');
    } catch (err) {
      setError(errorMessage(err, 'Could not remove the photo.'));
    }
  };

  const remove = async () => {
    if (!current || !window.confirm(`Delete "${current.name}" from your meal list?`)) return;
    setSaving(true);
    setError(null);
    try {
      await axios.delete(`/api/admin/meals/catalog/${current._id}`);
      onChanged(null);
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Could not delete the meal.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
        <DialogTitle>{current ? `Edit ${current.name}` : 'New meal'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 1 }}>
            <TextField
              label="Meal name"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              sx={{ gridColumn: '1 / -1' }}
              autoFocus={!current}
            />
            <TextField
              select
              label="Usual slot"
              value={form.slot}
              onChange={(e) => {
                const slot = e.target.value as MealSlot;
                update(current ? { slot } : { slot, price: String(MENU_PRICES[slot] ?? 0) });
              }}
            >
              {MEAL_SLOT_ORDER.map((slot) => (
                <MenuItem key={slot} value={slot}>
                  {MEAL_SLOT_LABELS[slot]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Price"
              type="number"
              value={form.price}
              onChange={(e) => update({ price: e.target.value })}
              inputProps={{ min: 0, step: '0.01' }}
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              multiline
              minRows={2}
              sx={{ gridColumn: '1 / -1' }}
            />
            <TextField
              label="Instagram link (optional)"
              value={form.instagramLink}
              onChange={(e) => update({ instagramLink: e.target.value })}
              sx={{ gridColumn: '1 / -1' }}
            />
            <FormControlLabel
              sx={{ gridColumn: '1 / -1' }}
              control={
                <Switch checked={form.soldIndividually} onChange={(e) => update({ soldIndividually: e.target.checked })} />
              }
              label="Sell individually (off = packages only)"
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'grey.50' }}>
            <Avatar
              variant="rounded"
              src={photoUrl}
              alt={form.name || 'Meal photo'}
              sx={{ width: 64, height: 64, bgcolor: 'grey.200', color: 'grey.500' }}
            >
              <RestaurantIcon />
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button variant="outlined" size="small" onClick={() => setPhotoOpen(true)} disabled={saving}>
                  {photoUrl ? 'Change photo' : 'Add photo'}
                </Button>
                {photoUrl && (
                  <Button size="small" color="error" onClick={removePhoto} disabled={saving}>
                    Remove photo
                  </Button>
                )}
              </Box>
              {!current && pendingPhoto && (
                <Typography variant="caption" color="text.secondary">
                  The photo is saved with the meal when you press Save.
                </Typography>
              )}
            </Box>
          </Box>

          {current && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
              Changes to the name, price and description also apply to this meal on today’s and later days.
            </Typography>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {saved && !error && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Meal saved.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: current ? 'space-between' : 'flex-end', px: 3, pb: 2 }}>
          {current && (
            <Button color="error" onClick={remove} disabled={saving}>
              Delete meal
            </Button>
          )}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onClose} disabled={saving}>
              {saved ? 'Done' : 'Cancel'}
            </Button>
            <Button variant="contained" onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
      <MealPhotoDialog
        open={photoOpen}
        mealName={current?.name ?? form.name.trim()}
        currentUrl={photoUrl}
        onClose={() => setPhotoOpen(false)}
        onUploaded={savePhoto}
      />
    </>
  );
}
