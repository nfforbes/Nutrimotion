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
import AddPackageForm from '@/components/admin/AddPackageForm';
import PackageList from '@/components/admin/PackageList';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import axios from 'axios';

interface PackageDoc {
  _id: string;
  name: string;
  description?: string;
  breakfastCount: number;
  lunchCount: number;
  dinnerCount: number;
  daysOption: 'any' | 'specific';
  specificDays: number[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPackagesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageDoc | null>(null);
  const [packages, setPackages] = useState<PackageDoc[]>([]);

  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await axios.get<PackageDoc[]>('/api/admin/packages');
      setPackages(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    }
  };

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Packages</Typography>
          {!showAddForm && !editingPackage && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddForm(true)}>
              Add Package
            </Button>
          )}
        </Box>

        {showAddForm || editingPackage ? (
          <AddPackageForm
            initialPackage={editingPackage}
            onSuccess={() => {
              setShowAddForm(false);
              setEditingPackage(null);
              fetchPackages();
            }}
            onCancel={() => {
              setShowAddForm(false);
              setEditingPackage(null);
            }}
          />
        ) : (
          <PackageList
            packages={packages}
            onEdit={(pkg) => setEditingPackage(pkg)}
          />
        )}
      </Container>
    </>
  );
}
