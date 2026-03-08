'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import AddRecipeForm from '@/components/admin/AddRecipeForm';
import RecipeList from '@/components/admin/RecipeList';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import axios from 'axios';

interface RecipeDoc {
  _id: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

export default function AdminRecipesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [recipes, setRecipes] = useState<RecipeDoc[]>([]);

  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await axios.get<RecipeDoc[]>('/api/admin/uploads/recipes');
      setRecipes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
    }
  };

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Recipes Management</Typography>
          {!showAddForm && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddForm(true)}>
              Add Recipe
            </Button>
          )}
        </Box>

        {showAddForm ? (
          <AddRecipeForm
            onSuccess={() => {
              setShowAddForm(false);
              fetchRecipes();
            }}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <RecipeList recipes={recipes} />
        )}
      </Container>
    </>
  );
}
