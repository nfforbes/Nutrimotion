/**
 * Admin Deliveries Management Page
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppSelector } from '@/store';
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

export default function AdminDeliveriesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [driverId, setDriverId] = useState('');

  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    // TODO: Fetch deliveries from API
  }, []);

  const handleAssignDriver = async () => {
    if (!selectedOrder || !driverId) return;
    // TODO: Assign driver via API
    console.log('Assign driver:', driverId, 'to order:', selectedOrder.id);
    setAssignDialogOpen(false);
    setSelectedOrder(null);
    setDriverId('');
  };

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <LocalShippingIcon fontSize="large" color="primary" />
          <Typography variant="h4">
            Delivery Management
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Delivery Address</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Driver</TableCell>
                    <TableCell>Assigned At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deliveries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          No deliveries found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    deliveries.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell>{delivery.orderNumber}</TableCell>
                        <TableCell>{delivery.customerName}</TableCell>
                        <TableCell>
                          {delivery.address
                            ? `${delivery.address.street}, ${delivery.address.city}`
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={delivery.status}
                            color={statusColors[delivery.status as OrderStatus] || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{delivery.driverName || 'Unassigned'}</TableCell>
                        <TableCell>
                          {delivery.assignedAt
                            ? format(new Date(delivery.assignedAt), 'PPp')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {!delivery.driverId && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setSelectedOrder(delivery);
                                setAssignDialogOpen(true);
                              }}
                            >
                              Assign Driver
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Container>

      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)}>
        <DialogTitle>Assign Driver</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, minWidth: 300 }}>
            <FormControl fullWidth>
              <InputLabel>Select Driver</InputLabel>
              <Select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                label="Select Driver"
              >
                {/* TODO: Populate with actual drivers */}
                <MenuItem value="driver1">Driver 1</MenuItem>
                <MenuItem value="driver2">Driver 2</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAssignDriver} variant="contained">
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
