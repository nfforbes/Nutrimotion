/**
 * Add Package Form Component
 * Define a package: counts for breakfast/lunch/smoothies/juice shots and any days or specific days.
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
  FormControlLabel,
  Checkbox,
  FormGroup,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface PackageDoc {
  _id: string;
  name: string;
  description?: string;
  breakfastCount: number;
  lunchCount: number;
  smoothieCount?: number;
  juiceShotCount?: number;
  /** @deprecated legacy */
  dinnerCount?: number;
  cost?: number;
  daysOption: 'any' | 'specific';
  specificDays: number[];
  active: boolean;
}

const initialFormData = {
  name: '',
  description: '',
  breakfastCount: 0,
  lunchCount: 0,
  smoothieCount: 0,
  juiceShotCount: 0,
  cost: 0,
  daysOption: 'any' as 'any' | 'specific',
  specificDays: [] as number[],
  active: true,
};

export interface AddPackageFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialPackage?: PackageDoc | null;
}

export default function AddPackageForm({ onSuccess, onCancel, initialPackage }: AddPackageFormProps) {
  const [formData, setFormData] = useState(() =>
    initialPackage
      ? {
          name: initialPackage.name,
          description: initialPackage.description ?? '',
          breakfastCount: initialPackage.breakfastCount,
          lunchCount: initialPackage.lunchCount,
          smoothieCount: initialPackage.smoothieCount ?? initialPackage.dinnerCount ?? 0,
          juiceShotCount: initialPackage.juiceShotCount ?? 0,
          cost: initialPackage.cost ?? 0,
          daysOption: initialPackage.daysOption,
          specificDays: [...(initialPackage.specificDays || [])],
          active: initialPackage.active,
        }
      : initialFormData
  );

  useEffect(() => {
    if (initialPackage) {
      setFormData({
        name: initialPackage.name,
        description: initialPackage.description ?? '',
        breakfastCount: initialPackage.breakfastCount,
        lunchCount: initialPackage.lunchCount,
        smoothieCount: initialPackage.smoothieCount ?? initialPackage.dinnerCount ?? 0,
        juiceShotCount: initialPackage.juiceShotCount ?? 0,
        cost: initialPackage.cost ?? 0,
        daysOption: initialPackage.daysOption,
        specificDays: [...(initialPackage.specificDays || [])],
        active: initialPackage.active,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [initialPackage]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDayToggle = (dayIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      specificDays: prev.specificDays.includes(dayIndex)
        ? prev.specificDays.filter((d) => d !== dayIndex)
        : [...prev.specificDays, dayIndex].sort((a, b) => a - b),
    }));
  };

  const handleSubmit = async () => {
    setError(null);

    const name = formData.name?.trim();
    if (!name) {
      setError('Name is required.');
      return;
    }
    if (formData.daysOption === 'specific' && formData.specificDays.length === 0) {
      setError('Select at least one day when using specific days.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        description: formData.description?.trim() || undefined,
        breakfastCount: formData.breakfastCount,
        lunchCount: formData.lunchCount,
        smoothieCount: formData.smoothieCount,
        juiceShotCount: formData.juiceShotCount,
        cost: Number(formData.cost ?? 0),
        daysOption: formData.daysOption,
        specificDays: formData.daysOption === 'specific' ? formData.specificDays : [],
        active: formData.active,
      };
      if (initialPackage) {
        await axios.patch(`/api/admin/packages/${initialPackage._id}`, payload);
      } else {
        await axios.post('/api/admin/packages', payload);
      }
      setFormData(initialFormData);
      onSuccess();
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : err instanceof Error
            ? err.message
            : 'Failed to create package';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={onCancel} size="small" sx={{ mr: 1 }}>
            Back
          </Button>
          <Typography variant="h6">{initialPackage ? 'Edit Package' : 'Add New Package'}</Typography>
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
            label="Package name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="Description (optional)"
            multiline
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <TextField
            fullWidth
            label="Breakfasts"
            type="number"
            inputProps={{ min: 0, step: 1 }}
            value={formData.breakfastCount}
            onChange={(e) =>
              setFormData({ ...formData, breakfastCount: Math.max(0, parseInt(e.target.value, 10) || 0) })
            }
          />
          <TextField
            fullWidth
            label="Lunches"
            type="number"
            inputProps={{ min: 0, step: 1 }}
            value={formData.lunchCount}
            onChange={(e) =>
              setFormData({ ...formData, lunchCount: Math.max(0, parseInt(e.target.value, 10) || 0) })
            }
          />
          <TextField
            fullWidth
            label="Smoothies"
            type="number"
            inputProps={{ min: 0, step: 1 }}
            value={formData.smoothieCount}
            onChange={(e) =>
              setFormData({ ...formData, smoothieCount: Math.max(0, parseInt(e.target.value, 10) || 0) })
            }
          />
          <TextField
            fullWidth
            label="Juice Shots"
            type="number"
            inputProps={{ min: 0, step: 1 }}
            value={formData.juiceShotCount}
            onChange={(e) =>
              setFormData({ ...formData, juiceShotCount: Math.max(0, parseInt(e.target.value, 10) || 0) })
            }
          />
          <TextField
            fullWidth
            label="Cost ($)"
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            value={formData.cost ?? 0}
            onChange={(e) =>
              setFormData({ ...formData, cost: Math.max(0, parseFloat(e.target.value) || 0) })
            }
          />

          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Days
            </Typography>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.daysOption === 'any'}
                    onChange={(_, checked) =>
                      setFormData({ ...formData, daysOption: checked ? 'any' : 'specific' })
                    }
                  />
                }
                label="Any days"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.daysOption === 'specific'}
                    onChange={(_, checked) =>
                      setFormData({
                        ...formData,
                        daysOption: checked ? 'specific' : 'any',
                        specificDays: checked ? formData.specificDays : [],
                      })
                    }
                  />
                }
                label="Specific days"
              />
            </FormGroup>
            {formData.daysOption === 'specific' && (
              <FormGroup row sx={{ mt: 1, gap: 0 }}>
                {DAY_LABELS.map((label, i) => (
                  <FormControlLabel
                    key={i}
                    control={
                      <Checkbox
                        checked={formData.specificDays.includes(i)}
                        onChange={() => handleDayToggle(i)}
                      />
                    }
                    label={label}
                  />
                ))}
              </FormGroup>
            )}
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
            }
            label="Active"
            sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
          />

          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
                {submitting ? (initialPackage ? 'Saving…' : 'Creating…') : initialPackage ? 'Save Changes' : 'Create Package'}
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
