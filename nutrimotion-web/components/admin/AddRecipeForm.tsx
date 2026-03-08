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
  imageUrl: '',
  ingredients: '',
  instructions: '',
  prepTime: '',
  cookTime: '',
  servings: '',
  difficulty: 'easy',
};

export interface AddRecipeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddRecipeForm({ onSuccess, onCancel }: AddRecipeFormProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    const title = formData.title?.trim();
    const description = formData.description?.trim();
    const imageUrl = formData.imageUrl?.trim();
    const prepTime = parseInt(formData.prepTime, 10);
    const cookTime = parseInt(formData.cookTime, 10);
    const servings = parseInt(formData.servings, 10);

    if (
      !title ||
      !description ||
      !imageUrl ||
      Number.isNaN(prepTime) ||
      Number.isNaN(cookTime) ||
      Number.isNaN(servings) ||
      !formData.difficulty
    ) {
      setError('Please fill all required fields (Title, Description, Image URL, Prep Time, Cook Time, Servings, Difficulty).');
      return;
    }

    setSubmitting(true);
    try {
      const ingredientsArr = formData.ingredients
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const instructionsArr = formData.instructions
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      await axios.post('/api/admin/uploads/recipes', {
        title,
        description,
        imageUrl,
        ingredients: ingredientsArr,
        instructions: instructionsArr,
        prepTime,
        cookTime,
        servings,
        difficulty: formData.difficulty,
      });
      setFormData(initialFormData);
      onSuccess();
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : err instanceof Error
            ? err.message
            : 'Failed to create recipe';
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
          <Typography variant="h6">Add New Recipe</Typography>
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
            label="Recipe Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
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
            label="Description"
            multiline
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
          />
          <TextField
            fullWidth
            select
            label="Difficulty"
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
          >
            <MenuItem value="easy">Easy</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="hard">Hard</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Prep Time (minutes)"
            type="number"
            value={formData.prepTime}
            onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="Cook Time (minutes)"
            type="number"
            value={formData.cookTime}
            onChange={(e) => setFormData({ ...formData, cookTime: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="Servings"
            type="number"
            value={formData.servings}
            onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="Ingredients (one per line)"
            multiline
            rows={4}
            value={formData.ingredients}
            onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
            sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
          />
          <TextField
            fullWidth
            label="Instructions (one per line)"
            multiline
            rows={6}
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
          />

          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Recipe'}
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
