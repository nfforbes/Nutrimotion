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
  title: '',
  description: '',
  thumbnailUrl: '',
  videoUrl: '',
  duration: '',
  category: 'cooking',
  tags: '',
};

export interface AddVideoFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddVideoForm({ onSuccess, onCancel }: AddVideoFormProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    const title = formData.title?.trim();
    const description = formData.description?.trim();
    const thumbnailUrl = formData.thumbnailUrl?.trim();
    const videoUrl = formData.videoUrl?.trim();
    const durationNum = parseInt(formData.duration, 10);
    const durationValid = !Number.isNaN(durationNum) && durationNum >= 0;

    if (!title || !description || !thumbnailUrl || !videoUrl || !durationValid || !formData.category) {
      setError('Please fill all required fields (Title, Description, Thumbnail URL, Video URL, Duration, Category).');
      return;
    }

    setSubmitting(true);
    try {
      const tagsArray = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await axios.post('/api/admin/uploads/videos', {
        title,
        description,
        thumbnailUrl,
        videoUrl,
        duration: durationNum,
        category: formData.category,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      });
      setFormData(initialFormData);
      onSuccess();
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : err instanceof Error
            ? err.message
            : 'Failed to create video';
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
          <Typography variant="h6">Add New Video</Typography>
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
            label="Video Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
            label="Thumbnail URL"
            value={formData.thumbnailUrl}
            onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="Video URL"
            value={formData.videoUrl}
            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
            required
          />
          <TextField
            fullWidth
            select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <MenuItem value="cooking">Cooking</MenuItem>
            <MenuItem value="training">Training</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Duration (seconds)"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="Tags (comma-separated)"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
          />

          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Video'}
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
