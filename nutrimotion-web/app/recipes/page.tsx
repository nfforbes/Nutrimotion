/**
 * Recipes Page
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Box,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchRecipesRequest } from '@/store/slices/catalogSlice';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import type { Recipe } from '@/types/catalog';

export default function RecipesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const { recipes, isLoading, error } = useAppSelector((state) => state.catalog);

  useEffect(() => {
    dispatch(fetchRecipesRequest());
  }, [dispatch]);

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Recipes
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Discover healthy and delicious recipes
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : recipes.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" align="center" sx={{ py: 4 }}>
                No recipes available at the moment. Check back soon!
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {recipes.map((recipe) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={recipe.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={recipe.imageUrl || '/placeholder-recipe.jpg'}
                    alt={recipe.title}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {recipe.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {recipe.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={`${recipe.prepTime} min prep`} size="small" />
                      <Chip label={`${recipe.cookTime} min cook`} size="small" />
                      <Chip label={recipe.difficulty} size="small" color="primary" variant="outlined" />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button fullWidth variant="outlined" onClick={() => setSelectedRecipe(recipe)}>
                      View Recipe
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Dialog
        open={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedRecipe && (
          <>
            <DialogTitle>{selectedRecipe.title}</DialogTitle>
            <DialogContent dividers>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedRecipe.description}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Ingredients
              </Typography>
              <List dense disablePadding sx={{ mb: 2 }}>
                {selectedRecipe.ingredients.map((item, i) => (
                  <ListItem key={i} disablePadding sx={{ py: 0.25 }}>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
              <Typography variant="subtitle2" gutterBottom>
                Instructions
              </Typography>
              <List dense disablePadding>
                {selectedRecipe.instructions.map((step, i) => (
                  <ListItem key={i} disablePadding sx={{ py: 0.25, alignItems: 'flex-start' }}>
                    <ListItemText primary={`${i + 1}. ${step}`} />
                  </ListItem>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedRecipe(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
