'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import AddTrainingForm, { type TrainingDoc } from '@/components/admin/AddTrainingForm';
import TrainingList from '@/components/admin/TrainingList';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import axios from 'axios';

export default function AdminTrainingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TrainingDoc | null>(null);
  const [packages, setPackages] = useState<TrainingDoc[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await axios.get<TrainingDoc[]>('/api/admin/uploads/training');
      setPackages(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch training packages:', err);
      setError('Could not load training packages.');
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (pkg: TrainingDoc) => {
    if (!window.confirm(`Delete "${pkg.name}"? This cannot be undone.`)) return;
    setDeletingId(pkg._id);
    setError(null);
    try {
      await axios.delete(`/api/admin/uploads/training/${pkg._id}`);
      setPackages((prev) => prev.filter((p) => p._id !== pkg._id));
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Could not delete the training package.';
      setError(message);
    } finally {
      setDeletingId(null);
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
          {!showForm && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditing(null);
                setShowForm(true);
                setError(null);
              }}
            >
              Add Package
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {showForm ? (
          <AddTrainingForm
            packageToEdit={editing}
            onSuccess={() => {
              closeForm();
              fetchPackages();
            }}
            onCancel={closeForm}
          />
        ) : (
          <TrainingList
            packages={packages}
            deletingId={deletingId}
            onEdit={(pkg) => {
              setEditing(pkg);
              setShowForm(true);
              setError(null);
            }}
            onDelete={handleDelete}
          />
        )}
      </Container>
    </>
  );
}
