/**
 * Driver Profile Page
 */

'use client';

import { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
} from '@mui/material';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';

export default function DriverProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const auth = useAppSelector((state) => state.auth);
  
  const menuItems = getAllMenuItemsForUser(auth.permissions);
  
  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />
      
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Driver Profile
        </Typography>
        
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Name"
                value={auth.user?.name || ''}
                disabled
              />
              <TextField
                fullWidth
                label="Email"
                value={auth.user?.email || ''}
                disabled
              />
              <TextField
                fullWidth
                label="Phone"
                placeholder="Enter your phone number"
              />
              <TextField
                fullWidth
                label="Vehicle Information"
                placeholder="Enter vehicle make, model, and license plate"
              />
              <Button variant="contained" fullWidth>
                Save Profile
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
