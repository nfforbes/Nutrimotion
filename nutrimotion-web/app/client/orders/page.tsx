/**
 * Client Orders Page
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchOrdersRequest } from '@/store/slices/orderSlice';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import { OrderStatus } from '@/types/commerce';
import { format } from 'date-fns';

const statusColors: Record<OrderStatus, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  [OrderStatus.PENDING]: 'default',
  [OrderStatus.PURCHASED]: 'info',
  [OrderStatus.PREPARING]: 'warning',
  [OrderStatus.OUT_FOR_DELIVERY]: 'primary',
  [OrderStatus.DELIVERED]: 'success',
  [OrderStatus.CANCELLED]: 'error',
};

export default function ClientOrdersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { orders, isLoading } = useAppSelector((state) => state.order);
  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchOrdersRequest());
  }, [dispatch]);

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Orders
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" align="center" sx={{ py: 4 }}>
                You have no orders yet
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6">Order #{order.orderNumber}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(order.createdAt), 'PPP')}
                      </Typography>
                    </Box>
                    <Chip label={order.status} color={statusColors[order.status]} />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <List dense>
                    {order.items.map((item) => (
                      <ListItem key={item.id}>
                        <ListItemText
                          primary={item.name}
                          secondary={`Quantity: ${item.quantity} × $${item.price.toFixed(2)}`}
                        />
                        <Typography variant="body2">
                          ${(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1">Total:</Typography>
                    <Typography variant="h6" color="primary">
                      ${order.total.toFixed(2)}
                    </Typography>
                  </Box>

                  {order.deliveryAddress && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Delivery Address:
                      </Typography>
                      <Typography variant="body2">
                        {order.deliveryAddress.street}, {order.deliveryAddress.parish}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>
    </>
  );
}
