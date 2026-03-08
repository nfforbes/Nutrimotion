/**
 * Admin Orders Management Page
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import { OrderStatus } from '@/types/commerce';
import axios from 'axios';
import { format } from 'date-fns';

const statusColors: Record<OrderStatus, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  [OrderStatus.PENDING]: 'default',
  [OrderStatus.PURCHASED]: 'info',
  [OrderStatus.PREPARING]: 'warning',
  [OrderStatus.OUT_FOR_DELIVERY]: 'primary',
  [OrderStatus.DELIVERED]: 'success',
  [OrderStatus.CANCELLED]: 'error',
};

export default function AdminOrdersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [driverId, setDriverId] = useState('');
  const [drivers, setDrivers] = useState<any[]>([]);

  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    fetchOrders();
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await axios.get('/api/admin/users?role=driver');
      setDrivers(response.data);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/admin/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      await axios.patch(`/api/admin/orders/${selectedOrder._id}/status`, {
        status: newStatus,
        note: statusNote,
        driverId: newStatus === OrderStatus.OUT_FOR_DELIVERY ? driverId : undefined,
      });
      setStatusDialogOpen(false);
      setSelectedOrder(null);
      setNewStatus('');
      setStatusNote('');
      fetchOrders();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedOrder || !driverId) return;

    try {
      await axios.post(`/api/admin/orders/${selectedOrder._id}/assign`, {
        driverId,
      });
      setAssignDialogOpen(false);
      setSelectedOrder(null);
      setDriverId('');
      fetchOrders();
    } catch (error) {
      console.error('Failed to assign driver:', error);
    }
  };

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Orders Management
        </Typography>

        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>{order.orderNumber}</TableCell>
                      <TableCell>
                        {order.userId?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>${order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          color={statusColors[order.status as OrderStatus]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.createdAt), 'PP')}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setSelectedOrder(order);
                              setNewStatus(order.status);
                              setStatusDialogOpen(true);
                            }}
                          >
                            Update Status
                          </Button>
                          {!order.assignedDriverId && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => {
                                setSelectedOrder(order);
                                setAssignDialogOpen(true);
                              }}
                            >
                              Assign Driver
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Container>

      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="Status"
              >
                {Object.values(OrderStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {newStatus === OrderStatus.OUT_FOR_DELIVERY && (
              <FormControl fullWidth required>
                <InputLabel>Assign Driver</InputLabel>
                <Select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  label="Assign Driver"
                >
                  {drivers.map((driver) => (
                    <MenuItem key={driver._id} value={driver._id}>
                      {driver.name} ({driver.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField
              fullWidth
              label="Note (Optional)"
              multiline
              rows={3}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateStatus}
            variant="contained"
            disabled={newStatus === OrderStatus.OUT_FOR_DELIVERY && !driverId}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)}>
        <DialogTitle>Assign Driver</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, minWidth: 300 }}>
            <FormControl fullWidth required>
              <InputLabel>Driver</InputLabel>
              <Select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                label="Driver"
              >
                {drivers.map((driver) => (
                  <MenuItem key={driver._id} value={driver._id}>
                    {driver.name} ({driver.email})
                  </MenuItem>
                ))}
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
