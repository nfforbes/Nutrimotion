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
  CardMedia,
  CardActions,
  Button,
  Box,
  CircularProgress,
  Grid,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchTrainingRequest } from '@/store/slices/catalogSlice';
import { addToCartRequest } from '@/store/slices/cartSlice';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';

export default function TrainingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const { training, isLoading, error } = useAppSelector((state) => state.catalog);

  useEffect(() => {
    dispatch(fetchTrainingRequest());
  }, [dispatch]);

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  const handleAddToCart = (pkg: (typeof training)[0]) => {
    dispatch(
      addToCartRequest({
        itemType: 'training',
        itemId: pkg.id,
        name: pkg.name,
        price: pkg.price,
        quantity: 1,
        imageUrl: pkg.imageUrl,
      })
    );
    setSnackbarMessage(`${pkg.name} added to cart`);
  };

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

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : training.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" align="center" sx={{ py: 4 }}>
                No training packages available at the moment. Check back soon!
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {training.map((pkg) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pkg.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="180"
                    image={pkg.imageUrl || '/placeholder-training.jpg'}
                    alt={pkg.name}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {pkg.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {pkg.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      {pkg.duration && <Chip label={pkg.duration} size="small" />}
                      {pkg.level && (
                        <Chip label={pkg.level} size="small" color="primary" variant="outlined" />
                      )}
                    </Box>
                    <Typography variant="h6" color="primary">
                      ${pkg.price.toFixed(2)}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddShoppingCartIcon />}
                      onClick={() => handleAddToCart(pkg)}
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

      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={4000}
        onClose={() => setSnackbarMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={snackbarMessage}
      />
    </>
  );
}
