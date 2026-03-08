/**
 * Training Page
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  CircularProgress,
  Grid,
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';

interface TrainingPackage {
  id: string;
  name: string;
  description?: string;
  price: number;
}

export default function TrainingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const auth = useAppSelector((state) => state.auth);

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  // Mock training packages - replace with API call
  const trainingPackages: TrainingPackage[] = [];

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Training Packages
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Choose from our personalized training programs
        </Typography>

        {trainingPackages.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" align="center" sx={{ py: 4 }}>
                No training packages available at the moment. Check back soon!
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {trainingPackages.map((pkg) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pkg.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{pkg.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {pkg.description}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                      ${pkg.price}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddShoppingCartIcon />}
                    >
                      Add to Cart
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
}
