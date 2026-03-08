/**
 * Checkout Page
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  MenuItem,
} from '@mui/material';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCartRequest } from '@/store/slices/cartSlice';
import { createOrderRequest } from '@/store/slices/orderSlice';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    parish: '',
  });
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  const dispatch = useAppDispatch();
  const router = useRouter();
  const { cart } = useAppSelector((state) => state.cart);
  const { currentOrder, isLoading, error } = useAppSelector((state) => state.order);
  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchCartRequest());
  }, [dispatch]);

  useEffect(() => {
    if (currentOrder) {
      router.push(`/client/orders`);
    }
  }, [currentOrder, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch(
      createOrderRequest({
        deliveryAddress,
        deliveryInstructions,
      })
    );
  };

  const JAMAICAN_PARISHES = [
    'Kingston',
    'St. Andrew',
    'St. Thomas',
    'Portland',
    'St. Mary',
    'St. Ann',
    'Trelawny',
    'St. James',
    'Hanover',
    'Westmoreland',
    'St. Elizabeth',
    'Manchester',
    'Clarendon',
    'St. Catherine'
  ];

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  if (!cart || cart.items.length === 0) {
    return (
      <>
        <AppBar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="warning">Your cart is empty</Alert>
          <Button variant="contained" onClick={() => router.push('/meals')} sx={{ mt: 2 }}>
            Browse Meals
          </Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Checkout
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Delivery Address
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Street Address"
                        value={deliveryAddress.street}
                        onChange={(e) =>
                          setDeliveryAddress({ ...deliveryAddress, street: e.target.value })
                        }
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        select
                        fullWidth
                        label="Parish"
                        value={deliveryAddress.parish}
                        onChange={(e) =>
                          setDeliveryAddress({ ...deliveryAddress, parish: e.target.value })
                        }
                        required
                      >
                        {JAMAICAN_PARISHES.map((parish) => (
                          <MenuItem key={parish} value={parish}>
                            {parish}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Delivery Instructions (Optional)"
                        multiline
                        rows={3}
                        value={deliveryInstructions}
                        onChange={(e) => setDeliveryInstructions(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Order Summary
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Subtotal:</Typography>
                    <Typography>${cart.subtotal.toFixed(2)}</Typography>
                  </Box>

                  {cart.discount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="success.main">Discount:</Typography>
                      <Typography color="success.main">
                        -${cart.discount.toFixed(2)}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" color="primary">
                      ${cart.total.toFixed(2)}
                    </Typography>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isLoading}
                    sx={{ mt: 3 }}
                  >
                    {isLoading ? 'Processing...' : 'Place Order'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </form>
      </Container>
    </>
  );
}
