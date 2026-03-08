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
import AddTrainingForm from '@/components/admin/AddTrainingForm';
import TrainingList from '@/components/admin/TrainingList';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import axios from 'axios';

interface TrainingDoc {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  duration?: string;
  level?: string;
}

export default function AdminTrainingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [packages, setPackages] = useState<TrainingDoc[]>([]);

  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await axios.get<TrainingDoc[]>('/api/admin/uploads/training');
      setPackages(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch training packages:', error);
    }
  };

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Training Packages Management</Typography>
          {!showAddForm && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddForm(true)}>
              Add Package
            </Button>
          )}
        </Box>

        {showAddForm ? (
          <AddTrainingForm
            onSuccess={() => {
              setShowAddForm(false);
              fetchPackages();
            }}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <TrainingList packages={packages} />
        )}
      </Container>
    </>
  );
}
