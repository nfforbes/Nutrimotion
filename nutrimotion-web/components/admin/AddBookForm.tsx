'use client';

import { useState } from 'react';
import {
  Avatar,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import axios from 'axios';
import MealPhotoDialog from '@/components/admin/meals/MealPhotoDialog';
import { uploadBookPhoto } from '@/lib/images/uploadMealPhoto';

const initialFormData = {
  title: '',
  author: '',
  description: '',
  coverImageUrl: '',
  price: '',
  pdfUrl: '',
  buyUrl: '',
  isbn: '',
};

export interface BookDraft {
  _id: string;
  title: string;
  author: string;
  description?: string;
  coverImageUrl?: string;
  price?: number;
  pdfUrl?: string;
  buyUrl?: string;
  isbn?: string;
}

export interface AddBookFormProps {
  /** When set, the form updates this book instead of creating one. */
  book?: BookDraft | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function formFromBook(book?: BookDraft | null) {
  if (!book) return initialFormData;
  return {
    title: book.title ?? '',
    author: book.author ?? '',
    description: book.description ?? '',
    coverImageUrl: book.coverImageUrl ?? '',
    price: book.price === undefined || book.price === null ? '' : String(book.price),
    pdfUrl: book.pdfUrl ?? '',
    buyUrl: book.buyUrl ?? '',
    isbn: book.isbn ?? '',
  };
}

export default function AddBookForm({ book, onSuccess, onCancel }: AddBookFormProps) {
  const [formData, setFormData] = useState(() => formFromBook(book));
  const [photoOpen, setPhotoOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    const title = formData.title?.trim();
    const author = formData.author?.trim();
    const description = formData.description?.trim();
    const coverImageUrl = formData.coverImageUrl?.trim();
    const pdfUrl = formData.pdfUrl?.trim();
    const buyUrl = formData.buyUrl?.trim();
    const priceNum = parseFloat(formData.price);
    const priceValid = !Number.isNaN(priceNum) && priceNum >= 0;

    if (!title || !author || !description || !coverImageUrl) {
      setError('Please fill Title, Author, Description and add a cover photo.');
      return;
    }
    if (!buyUrl && (!priceValid || !pdfUrl)) {
      setError('Add a Buy link, or a Price and PDF URL.');
      return;
    }

    const payload = {
      title,
      author,
      description,
      coverImageUrl,
      price: priceValid ? priceNum : 0,
      pdfUrl: pdfUrl || undefined,
      buyUrl: buyUrl || undefined,
      isbn: formData.isbn?.trim() || undefined,
    };

    setSubmitting(true);
    try {
      if (book) {
        await axios.patch(`/api/admin/uploads/books/${book._id}`, payload);
      } else {
        await axios.post('/api/admin/uploads/books', payload);
      }
      setFormData(initialFormData);
      onSuccess();
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : err instanceof Error
            ? err.message
            : book
              ? 'Failed to update book'
              : 'Failed to create book';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const coverUrl = formData.coverImageUrl.trim();

  return (
    <>
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={onCancel} size="small" sx={{ mr: 1 }}>
            Back
          </Button>
          <Typography variant="h6">{book ? 'Edit Book' : 'Add New Book'}</Typography>
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
              src={coverUrl || undefined}
              alt={formData.title || 'Book cover'}
              sx={{ width: 72, height: 96, bgcolor: 'grey.200', color: 'grey.500' }}
            >
              <MenuBookIcon />
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setPhotoOpen(true)}
                  disabled={submitting}
                >
                  {coverUrl ? 'Change cover' : 'Add cover'}
                </Button>
                {coverUrl && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => setFormData({ ...formData, coverImageUrl: '' })}
                    disabled={submitting}
                  >
                    Remove cover
                  </Button>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Paste a screenshot, drag an image, or choose a file — same as meals.
              </Typography>
            </Box>
          </Box>
          <TextField
            fullWidth
            label="Buy link (e.g. Amazon)"
            value={formData.buyUrl}
            onChange={(e) => setFormData({ ...formData, buyUrl: e.target.value })}
            helperText="Shoppers are sent to this link. Leave blank to sell the PDF in the website cart."
          />
          <TextField
            fullWidth
            label="Price (for PDF sales)"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            disabled={!!formData.buyUrl.trim()}
          />
          <TextField
            fullWidth
            label="PDF URL (for PDF sales)"
            value={formData.pdfUrl}
            onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
            disabled={!!formData.buyUrl.trim()}
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
                {submitting ? 'Saving…' : book ? 'Save changes' : 'Create Book'}
              </Button>
              <Button onClick={onCancel} variant="outlined">
                Cancel
              </Button>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>

    <MealPhotoDialog
      open={photoOpen}
      mealName={formData.title.trim() || book?.title || 'book'}
      currentUrl={coverUrl || undefined}
      title={`Cover for ${formData.title.trim() || book?.title || 'this book'}`}
      upload={uploadBookPhoto}
      onClose={() => setPhotoOpen(false)}
      onUploaded={(url) => setFormData((current) => ({ ...current, coverImageUrl: url }))}
    />
    </>
  );
}
