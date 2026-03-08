'use client';

import { useState } from 'react';
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
import axios from 'axios';

const initialFormData = {
  name: '',
  description: '',
  imageUrl: '',
  price: '',
  duration: '',
  level: 'beginner',
  includes: '',
};

export interface AddTrainingFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddTrainingForm({ onSuccess, onCancel }: AddTrainingFormProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    const name = formData.name?.trim();
    const description = formData.description?.trim();
    const imageUrl = formData.imageUrl?.trim();
    const duration = formData.duration?.trim();
    const priceNum = parseFloat(formData.price);
    const priceValid = !Number.isNaN(priceNum) && priceNum >= 0;

    if (!name || !description || !imageUrl || !priceValid || !duration || !formData.level) {
      setError('Please fill all required fields (Name, Description, Image URL, Price, Duration, Level).');
      return;
    }

    setSubmitting(true);
    try {
      const includesArr = formData.includes
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      await axios.post('/api/admin/uploads/training', {
        name,
        description,
        imageUrl,
        price: priceNum,
        duration,
        level: formData.level,
        includes: includesArr.length > 0 ? includesArr : undefined,
      });
      setFormData(initialFormData);
      onSuccess();
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : err instanceof Error
            ? err.message
            : 'Failed to create training package';
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
          <Typography variant="h6">Add New Training Package</Typography>
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
            label="Image URL"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            required
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

          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Package'}
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
