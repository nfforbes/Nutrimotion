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
  Alert,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchCartRequest,
  removeFromCartRequest,
  updateCartItemRequest,
  applyDiscountRequest,
  removeDiscountRequest,
} from '@/store/slices/cartSlice';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import { useRouter } from 'next/navigation';

const PACKAGE_SLOT_ORDER = ['breakfast', 'lunch', 'dinner'] as const;

function formatPackageDayLabel(dateIso: string): string {
  const trimmed = dateIso.trim();
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (parts) {
    const y = Number(parts[1]);
    const m = Number(parts[2]);
    const d = Number(parts[3]);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
  const t = new Date(trimmed);
  return Number.isNaN(t.getTime())
    ? dateIso
    : t.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function slotLabel(slot: string): string {
  if (slot === 'breakfast') return 'Breakfast';
  if (slot === 'lunch') return 'Lunch';
  if (slot === 'dinner') return 'Dinner';
  return slot.charAt(0).toUpperCase() + slot.slice(1);
}

/** Stored names are plain strings; support legacy `{ name: string }` if present. */
function formatMealNamesList(meals: unknown): string {
  if (!Array.isArray(meals)) return '';
  return meals
    .map((m) =>
      typeof m === 'string'
        ? m
        : m && typeof m === 'object' && m !== null && 'name' in m
          ? String((m as { name: string }).name)
          : ''
    )
    .filter(Boolean)
    .join(', ');
}

export default function CartPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { cart, error: cartError } = useAppSelector((state) => state.cart);
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

  const handleRemoveDiscounts = () => {
    dispatch(removeDiscountRequest());
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
                                    Selected meals:
                                  </Typography>
                                  {Object.entries(item.packageDetails)
                                    .sort(([a], [b]) => a.localeCompare(b))
                                    .map(([date, slots]: [string, Record<string, unknown>]) => {
                                      const hasSelections = PACKAGE_SLOT_ORDER.some(
                                        (key) => Array.isArray(slots[key]) && (slots[key] as unknown[]).length > 0
                                      );
                                      if (!hasSelections) return null;
                                      return (
                                        <Box component="span" key={date} display="block" sx={{ ml: 1, mt: 0.5 }}>
                                          <Typography
                                            component="span"
                                            variant="caption"
                                            display="block"
                                            fontWeight="medium"
                                            sx={{ color: 'text.primary' }}
                                          >
                                            {formatPackageDayLabel(date)}
                                          </Typography>
                                          {PACKAGE_SLOT_ORDER.map((slotKey) => {
                                            const meals = slots[slotKey];
                                            if (!Array.isArray(meals) || meals.length === 0) return null;
                                            const line = formatMealNamesList(meals);
                                            if (!line) return null;
                                            return (
                                              <Typography
                                                component="span"
                                                variant="caption"
                                                display="block"
                                                sx={{ ml: 2, color: 'text.secondary' }}
                                                key={`${date}-${slotKey}`}
                                              >
                                                {slotLabel(slotKey)}: {line}
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
                    {cartError && (
                      <Alert severity="error" sx={{ mb: 1 }} onClose={() => dispatch(fetchCartRequest())}>
                        {cartError}
                      </Alert>
                    )}
                    {(cart.discountCodes?.length ?? 0) > 0 && (
                      <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                          Applied:
                        </Typography>
                        {cart.discountCodes!.map((c) => (
                          <Chip key={c} size="small" label={c} color="primary" variant="outlined" />
                        ))}
                        <Button size="small" onClick={handleRemoveDiscounts} sx={{ ml: 1 }}>
                          Remove
                        </Button>
                      </Box>
                    )}
                    <TextField
                      fullWidth
                      label="Coupon code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      size="small"
                      placeholder="Add another stackable code or replace"
                    />
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleApplyDiscount}
                      sx={{ mt: 1 }}
                      disabled={!discountCode.trim()}
                    >
                      Apply coupon
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
