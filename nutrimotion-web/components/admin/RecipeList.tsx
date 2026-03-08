'use client';

import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface RecipeDoc {
  _id: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

export interface RecipeListProps {
  recipes: RecipeDoc[];
}

export default function RecipeList({ recipes }: RecipeListProps) {
  if (recipes.length === 0) {
    return (
      <Typography color="text.secondary">
        No recipes yet. Click &quot;Add Recipe&quot; to create one.
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      {recipes.map((recipe) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={recipe._id}>
          <Card>
            <CardMedia
              component="img"
              height="200"
              image={recipe.imageUrl || '/placeholder-recipe.jpg'}
              alt={recipe.title}
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {recipe.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {recipe.description}
              </Typography>
            </CardContent>
            <CardActions>
              <IconButton size="small">
                <EditIcon />
              </IconButton>
              <IconButton size="small" color="error">
                <DeleteIcon />
              </IconButton>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
