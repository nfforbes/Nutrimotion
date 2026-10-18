'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import axios from 'axios';
import MealPhotoDialog from '@/components/admin/meals/MealPhotoDialog';
import { uploadTrainingPhoto } from '@/lib/images/uploadMealPhoto';

export interface TrainingDoc {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  duration?: string;
  level?: string;
  includes?: string[];
}

const initialFormData = {
  name: '',
  description: '',
  price: '',
  duration: '',
  level: 'beginner',
  includes: '',
};

function formFor(pkg: TrainingDoc | null) {
  if (!pkg) return initialFormData;
  return {
    name: pkg.name ?? '',
    description: pkg.description ?? '',
    price: String(pkg.price ?? ''),
    duration: pkg.duration ?? '',
    level: pkg.level || 'beginner',
    includes: (pkg.includes || []).join('\n'),
  };
}

export interface AddTrainingFormProps {
  /** Pass an existing package to edit; omit to create a new one. */
  packageToEdit?: TrainingDoc | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddTrainingForm({ packageToEdit = null, onSuccess, onCancel }: AddTrainingFormProps) {
  const [formData, setFormData] = useState(() => formFor(packageToEdit));
  const [imageUrl, setImageUrl] = useState(packageToEdit?.imageUrl || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const editing = Boolean(packageToEdit?._id);

  useEffect(() => {
    setFormData(formFor(packageToEdit));
    setImageUrl(packageToEdit?.imageUrl || '');
    setError(null);
  }, [packageToEdit]);

  const handleSubmit = async () => {
    setError(null);

    const name = formData.name?.trim();
    const description = formData.description?.trim();
    const duration = formData.duration?.trim();
    const priceNum = parseFloat(formData.price);
    const priceValid = !Number.isNaN(priceNum) && priceNum >= 0;
    const photo = imageUrl.trim();

    if (!name || !description || !photo || !priceValid || !duration || !formData.level) {
      setError('Please fill all required fields and add a photo.');
      return;
    }

    const includesArr = formData.includes
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const body = {
      name,
      description,
      imageUrl: photo,
      price: priceNum,
      duration,
      level: formData.level,
      includes: includesArr,
    };

    setSubmitting(true);
    try {
      if (editing && packageToEdit) {
        await axios.patch(`/api/admin/uploads/training/${packageToEdit._id}`, body);
      } else {
        await axios.post('/api/admin/uploads/training', body);
        setFormData(initialFormData);
        setImageUrl('');
      }
      onSuccess();
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : err instanceof Error
            ? err.message
            : editing
              ? 'Failed to update training package'
              : 'Failed to create training package';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={onCancel} size="small" sx={{ mr: 1 }}>
              Back
            </Button>
            <Typography variant="h6">
              {editing ? `Edit ${packageToEdit?.name}` : 'Add New Training Package'}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
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
              label="Package Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
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
              label="Duration"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="e.g., 4 weeks, 12 sessions"
              required
            />
            <TextField
              fullWidth
              select
              label="Level"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            >
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="What's Included (one per line)"
              multiline
              rows={4}
              value={formData.includes}
              onChange={(e) => setFormData({ ...formData, includes: e.target.value })}
              sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
            />

            <Box
              sx={{
                gridColumn: { xs: '1', md: '1 / -1' },
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'grey.50',
              }}
            >
              <Avatar
                variant="rounded"
                src={imageUrl || undefined}
                alt={formData.name || 'Training photo'}
                sx={{ width: 96, height: 96, bgcolor: 'grey.200', color: 'grey.500' }}
              >
                <FitnessCenterIcon />
              </Avatar>
              <Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setPhotoOpen(true)}
                    disabled={submitting}
                  >
                    {imageUrl ? 'Change photo' : 'Add photo'}
                  </Button>
                  {imageUrl && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => setImageUrl('')}
                      disabled={submitting}
                    >
                      Remove photo
                    </Button>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Paste a screenshot, drag an image, or choose a file — same as meals.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
                  {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create Package'}
                </Button>
                <Button onClick={onCancel} variant="outlined" disabled={submitting}>
                  Cancel
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <MealPhotoDialog
        open={photoOpen}
        mealName={formData.name.trim() || packageToEdit?.name || 'training'}
        currentUrl={imageUrl || undefined}
        title={`Photo for ${formData.name.trim() || packageToEdit?.name || 'this package'}`}
        upload={uploadTrainingPhoto}
        onClose={() => setPhotoOpen(false)}
        onUploaded={(url) => setImageUrl(url)}
      />
    </>
  );
}
