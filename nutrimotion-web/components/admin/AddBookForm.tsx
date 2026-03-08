'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';

const initialFormData = {
  title: '',
  author: '',
  description: '',
  coverImageUrl: '',
  price: '',
  pdfUrl: '',
  isbn: '',
};

export interface AddBookFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddBookForm({ onSuccess, onCancel }: AddBookFormProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    const title = formData.title?.trim();
    const author = formData.author?.trim();
    const description = formData.description?.trim();
    const coverImageUrl = formData.coverImageUrl?.trim();
    const pdfUrl = formData.pdfUrl?.trim();
    const priceNum = parseFloat(formData.price);
    const priceValid = !Number.isNaN(priceNum) && priceNum >= 0;

    if (!title || !author || !description || !coverImageUrl || !priceValid || !pdfUrl) {
      setError('Please fill all required fields (Title, Author, Description, Cover Image URL, Price, PDF URL).');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/admin/uploads/books', {
        title,
        author,
        description,
        coverImageUrl,
        price: priceNum,
        pdfUrl,
        isbn: formData.isbn?.trim() || undefined,
      });
      setFormData(initialFormData);
      onSuccess();
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : err instanceof Error
            ? err.message
            : 'Failed to create book';
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
          <Typography variant="h6">Add New Book</Typography>
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
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="Author"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
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
            label="Cover Image URL"
            value={formData.coverImageUrl}
            onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
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
            label="PDF URL"
            value={formData.pdfUrl}
            onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="ISBN (Optional)"
            value={formData.isbn}
            onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
          />

          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Book'}
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
