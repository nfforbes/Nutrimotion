/**
 * Cart Page
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  TextField,
  Button,
  Divider,
  Grid,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCartRequest, removeFromCartRequest, updateCartItemRequest, applyDiscountRequest } from '@/store/slices/cartSlice';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { cart } = useAppSelector((state) => state.cart);
  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchCartRequest());
  }, [dispatch]);

  const handleUpdateQuantity = (itemId: string, currentQuantity: number, delta: number) => {
    const newQuantity = Math.max(1, currentQuantity + delta);
    dispatch(updateCartItemRequest({ itemId, quantity: newQuantity }));
  };

  const handleRemove = (itemId: string) => {
    dispatch(removeFromCartRequest(itemId));
  };

  const handleApplyDiscount = () => {
    if (discountCode.trim()) {
      dispatch(applyDiscountRequest(discountCode.trim()));
    }
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Shopping Cart
        </Typography>

        {!cart || cart.items.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" align="center" sx={{ py: 4 }}>
                Your cart is empty
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button variant="contained" onClick={() => router.push('/meals')}>
                  Browse Meals
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card>
                <List>
                  {cart.items.map((item, index) => (
                    <Box key={item.id}>
                      {index > 0 && <Divider />}
                      <ListItem
                        secondaryAction={
                          <IconButton edge="end" onClick={() => handleRemove(item.id)}>
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar src={item.imageUrl} variant="rounded" sx={{ width: 60, height: 60 }} />
                        </ListItemAvatar>
                        <ListItemText
                          primary={item.name}
                          secondary={
                            <Box component="span" sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography component="span" variant="body2" color="text.secondary">
                                {`$${item.price.toFixed(2)} each`}
                              </Typography>
                              {item.itemType === 'package' && item.packageDetails && (
                                <Box component="span" sx={{ mt: 1, display: 'block' }}>
                                  <Typography component="span" variant="caption" color="text.secondary" display="block" fontWeight="bold">
                                    Package Selections:
                                  </Typography>
                                  {Object.entries(item.packageDetails).map(([date, slots]: [string, any]) => {
                                    const hasSelections = Object.values(slots).some((meals: any) => meals && meals.length > 0);
                                    if (!hasSelections) return null;
                                    return (
                                      <Box component="span" key={date} display="block" sx={{ ml: 1, mt: 0.5 }}>
                                        <Typography component="span" variant="caption" display="block" fontWeight="medium" sx={{ color: 'text.primary' }}>
                                          {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}:
                                        </Typography>
                                        {Object.entries(slots).map(([slot, meals]: [string, any]) => {
                                          if (!meals || meals.length === 0) return null;
                                          return (
                                            <Typography component="span" variant="caption" display="block" sx={{ ml: 2, color: 'text.secondary' }} key={slot}>
                                              • {slot.charAt(0).toUpperCase() + slot.slice(1)}: {meals.map((m: any) => m.name).join(', ')}
                                            </Typography>
                                          );
                                        })}
                                      </Box>
                                    );
                                  })}
                                </Box>
                              )}
                            </Box>
                          }
                          sx={{ ml: 2 }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Typography>{item.quantity}</Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                        <Typography variant="body1" fontWeight="bold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </ListItem>
                    </Box>
                  ))}
                </List>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Order Summary
                  </Typography>

                  <Box sx={{ my: 2 }}>
                    <TextField
                      fullWidth
                      label="Discount Code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      size="small"
                    />
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleApplyDiscount}
                      sx={{ mt: 1 }}
                    >
                      Apply
                    </Button>
                  </Box>

                  <Divider sx={{ my: 2 }} />

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
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleCheckout}
                    sx={{ mt: 3 }}
                  >
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
    </>
  );
}
